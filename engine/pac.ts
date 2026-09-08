/**
 * Moteur pompe à chaleur air/eau simplifié (docs/architecture-moteurs-v2.md §2).
 *
 * Aucune dépendance React, aucune requête réseau : toutes les constantes
 * viennent de `data/pac-baremes.json`, datées et sourcées. Ordres de grandeur
 * pour un prototype — ni devis, ni étude thermique.
 */
import baremes from "@/data/pac-baremes.json";
import zones from "@/data/zones.json";

import type { TrancheSurface } from "./solaire";

// ------------------------------------------------------------------ types

export type EnergieChauffage = "gaz" | "fioul" | "elec" | "bois";
export type ProfilRevenus = keyof typeof baremes.maprimerenov_2026_pac_air_eau.par_profil;

export type EntreesPac = {
  energie: EnergieChauffage;
  /** Dépense de chauffage annuelle en euros (voir `depenseChauffageDepuisFacture`). */
  depenseChauffageAn: number;
  surfaceTranche: TrancheSurface;
  dept: string;
  profil: ProfilRevenus;
  logementPlus15Ans: boolean;
};

export type OptionsPac = {
  tauxHausse?: number;
  horizon?: number;
  /** Couplage solaire : une part de la consommation PAC est autoconsommée. */
  couplageSolaire?: boolean;
};

export type ProjectionPac = {
  annees: number[];
  depenseSans: number[];
  coutAvec: number[];
  economies: number[];
  cumul: number;
};

export type PacResult = {
  kwhUtile: number;
  consoPacKwh: number;
  coutPacAn: number;
  economieAn: number;
  prix: number;
  aides: { mpr: number; cee: number; total: number };
  resteACharge: number;
  retourAns: number;
  zoneClimatique: string;
  couplageSolaire: boolean;
  projection: ProjectionPac;
};

type Zone = { zcSimple?: string };

const ZONES = zones as unknown as Record<string, Zone>;
const PRIX = baremes.prix_energie;

// ------------------------------------------------------------------ outils

function arrondi2(valeur: number): number {
  return Math.round(valeur * 100) / 100;
}

/** Prix du kWh de l'énergie actuelle ; le fioul passe par son PCI au litre. */
export function prixKwh(energie: EnergieChauffage): number {
  switch (energie) {
    case "elec":
      return PRIX.elec_kwh_ttc.valeur;
    case "gaz":
      return PRIX.gaz_kwh_ttc.valeur;
    case "bois":
      return PRIX.bois_kwh_ttc.valeur;
    case "fioul":
      return (
        PRIX.fioul_litre_ttc.valeur / PRIX.fioul_kwh_pci_par_litre.valeur
      );
  }
}

function rendementChaudiere(energie: EnergieChauffage): number {
  return baremes.rendement_chaudiere[energie];
}

/**
 * Dépense de chauffage estimée depuis la tranche de facture A8 : la part
 * chauffage est de 65 % pour gaz/fioul/bois et 55 % pour l'électrique.
 */
export function depenseChauffageDepuisFacture(
  indexTrancheFacture: number,
  chauffage: "gaz_fioul_bois" | "radiateurs_electriques",
): number {
  const table = baremes.depense_chauffage_annuelle_par_tranche_facture;
  const facture = table.facture_annuelle_par_tranche[indexTrancheFacture];

  if (facture === undefined) {
    throw new Error(`Tranche de facture inconnue : ${indexTrancheFacture}`);
  }

  return Math.round(facture * table.part_chauffage[chauffage]);
}

// -------------------------------------------------------------- projection

/**
 * Dépense de chauffage et coût de la PAC inflatés au même taux, `Math.ceil`
 * annuel — même convention que le moteur solaire pour que les deux écrans
 * racontent la même histoire.
 */
export function projeterPac({
  depenseChauffageAn,
  coutPacAn,
  tauxHausse,
  horizon,
}: {
  depenseChauffageAn: number;
  coutPacAn: number;
  tauxHausse: number;
  horizon: number;
}): ProjectionPac {
  const annees: number[] = [];
  const depenseSans: number[] = [];
  const coutAvec: number[] = [];
  const economies: number[] = [];

  let sans = depenseChauffageAn;
  let avec = coutPacAn;

  for (let annee = 0; annee <= horizon; annee++) {
    if (annee > 0) {
      sans = Math.ceil(sans * (1 + tauxHausse));
      avec = Math.ceil(avec * (1 + tauxHausse));
    }

    annees.push(annee);
    depenseSans.push(sans);
    coutAvec.push(avec);
    economies.push(sans - avec);
  }

  const cumul = economies.slice(1).reduce((total, e) => total + e, 0);

  return { annees, depenseSans, coutAvec, economies, cumul };
}

// ------------------------------------------------------------------ moteur

export function simulerPac(
  entrees: EntreesPac,
  options: OptionsPac = {},
): PacResult {
  const {
    tauxHausse = baremes.hausse_annuelle_defaut.elec,
    horizon = baremes.horizon_projection_ans,
    couplageSolaire = false,
  } = options;

  const zone = ZONES[entrees.dept];
  if (!zone?.zcSimple) {
    throw new Error(`Département inconnu : ${entrees.dept}`);
  }

  // --- Besoin de chauffage, puis consommation de la PAC via son SCOP réel
  const kwhUtile =
    (entrees.depenseChauffageAn / prixKwh(entrees.energie)) *
    rendementChaudiere(entrees.energie);
  const consoPacKwh = kwhUtile / baremes.scop_air_eau.valeur;

  let coutPacAn = consoPacKwh * PRIX.elec_kwh_ttc.valeur;
  if (couplageSolaire) {
    // 25 % de la consommation PAC couverte par l'autoconsommation solaire.
    coutPacAn *= 1 - baremes.couplage_solaire_pac.part_conso_pac_couverte.valeur;
  }

  const economieAn = entrees.depenseChauffageAn - coutPacAn;

  // --- Prix, aides, reste à charge
  // La table mêle les prix par tranche et un drapeau `extrapole` : le garde
  // `typeof` écarte donc à la fois la clé inconnue et le booléen.
  const tablePrix = baremes.prix_homeserve_pac_air_eau
    .par_tranche_surface as Record<string, number | boolean>;
  const prix = tablePrix[entrees.surfaceTranche];

  if (typeof prix !== "number") {
    throw new Error(`Tranche de surface inconnue : ${entrees.surfaceTranche}`);
  }

  /**
   * MPR **et** CEE coup de pouce supposent le remplacement d'un chauffage
   * existant dans un logement de plus de 15 ans. Le pseudo-code de
   * `architecture-moteurs-v2.md` §2 ne conditionne que MPR, mais
   * `pac_baremes.exemples_test` attend « rose + neuf → aides 0 » : la donnée
   * tranche, les deux aides sont conditionnées.
   */
  const mpr = entrees.logementPlus15Ans
    ? baremes.maprimerenov_2026_pac_air_eau.par_profil[entrees.profil]
    : 0;

  const cee = !entrees.logementPlus15Ans
    ? 0
    : entrees.energie === "elec"
      ? baremes.cee_coup_de_pouce_pac.depuis_electrique.valeur
      : (baremes.cee_coup_de_pouce_pac.remplacement_fossile_par_zone[
          zone.zcSimple as keyof typeof baremes.cee_coup_de_pouce_pac.remplacement_fossile_par_zone
        ] ?? 0);

  const total = mpr + cee;
  const resteACharge = Math.max(prix - total, 0);
  const retourAns = economieAn > 0 ? arrondi2(resteACharge / economieAn) : Infinity;

  return {
    kwhUtile: Math.round(kwhUtile),
    consoPacKwh: Math.round(consoPacKwh),
    coutPacAn: Math.round(coutPacAn),
    economieAn: Math.round(economieAn),
    prix,
    aides: { mpr, cee, total },
    resteACharge,
    retourAns,
    zoneClimatique: zone.zcSimple,
    couplageSolaire,
    projection: projeterPac({
      depenseChauffageAn: entrees.depenseChauffageAn,
      coutPacAn: Math.round(coutPacAn),
      tauxHausse,
      horizon,
    }),
  };
}
