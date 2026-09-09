/**
 * Moteur solaire — réappropriation du modèle EDF Solutions Solaires
 * (taux d'autoproduction + bonus/malus + projection avec taux de hausse).
 *
 * Aucune dépendance React, aucune requête réseau : toutes les constantes
 * viennent de `data/*.json`, datées et sourcées. Voir
 * `docs/retro-ingenierie-edf.md` §1.2 et `docs/releve-simulateur-edf.md` §3.
 *
 * Non-régression de référence (dept 69 = Z3, 100–135 m², 101–135 €/mois,
 * radiateurs électriques, véhicule électrique, chauffe-eau thermodynamique,
 * 5 j+) : facture 1 416 €, TAP 29,94 %, économies 424 €/an.
 */
import hypotheses from "@/data/hypotheses.json";
import tapBase from "@/data/tap-base.json";
import zones from "@/data/zones.json";

// ------------------------------------------------------------------ types

export type TrancheSurface = (typeof tapBase.tranches_surface)[number];

/**
 * Tranches de facture, dans l'ordre de `tap.facture_annuelle_par_tranche`.
 * Le JSON ne porte que les montants ; les libellés sont décrits dans son champ
 * `source`, d'où cette constante alignée index par index.
 */
export const TRANCHES_FACTURE = [
  "<60",
  "60-100",
  "101-135",
  "136-175",
  ">175",
] as const;

export type TrancheFacture = (typeof TRANCHES_FACTURE)[number];

export type Chauffage = keyof typeof hypotheses.tap.bonus_malus_points.chauffage;
export type Occupation =
  keyof typeof hypotheses.tap.bonus_malus_points.occupation;
export type ChauffeEau =
  keyof typeof hypotheses.tap.bonus_malus_points.chauffe_eau;
/**
 * D53 : le type de chauffe-eau est devenu un équipement (deux cases
 * exclusives). Les coefficients restent ceux de la table `chauffe_eau` de
 * hypotheses.json — rien n'est dupliqué.
 */
export type Equipement =
  | keyof typeof hypotheses.tap.bonus_malus_points.equipements
  | "chauffe_eau_electrique"
  | "chauffe_eau_thermodynamique"
  | "aucun";

const CHAUFFE_EAU_EQUIPEMENT: Record<string, ChauffeEau> = {
  chauffe_eau_electrique: "electrique_moins_10_ans",
  chauffe_eau_thermodynamique: "thermodynamique",
};

export type Personnes = "1-2" | "3-4" | "5+";

export type EntreesSolaire = {
  /** Code département sur deux caractères ("69", "2A"…). */
  dept: string;
  occupation: Occupation;
  /**
   * Nombre d'occupants (A3). Collecté pour la note au technicien : le modèle
   * EDF ne lui associe aucun coefficient, il n'entre donc pas dans le TAP.
   */
  personnes?: Personnes;
  surface_sol: TrancheSurface;
  chauffage: Chauffage;
  equipements: Equipement[];
  facture_mensuelle: TrancheFacture;
};

export type Stockage = "aucun" | "virtuel" | "batterie";
export type Kwc = 3 | 6 | 9;

export type OptionsSolaire = {
  tauxHausse?: number;
  horizon?: number;
  stockage?: Stockage;
  kwc?: Kwc;
  couplagePac?: boolean;
};

export type SolaireResult = {
  factureAnnuelle: number;
  /** TAP nu, borné à [12, 63]. */
  tapPct: number;
  /** TAP avec stockage : TAP + 21 pts, plafonné à 84. */
  tapBatteriePct: number;
  /** Celui réellement utilisé pour les économies (dépend du stockage choisi). */
  tapEffectifPct: number;
  /** Économies nettes : l'abonnement du stockage virtuel est déjà déduit. */
  economiesAn: number;
  /**
   * D55 : abonnement annuel du stockage virtuel (15 €/mois). Nul pour
   * « aucun » ; nul aussi pour la batterie physique, dont le prix est sur
   * devis et n'est donc pas compté ici.
   */
  abonnementStockageAn: number;
  kwcConseille: Kwc;
  prixPack: number;
  nomPack: string;
  productionKwhAn: number;
  surplusAn: number;
  aides: number;
  resteACharge: number;
  retourAns: number;
  horsZone: boolean;
  zoneEnsoleillement: string;
  productibleKwhParKwc: number;
  /** Détail des points, pour le bloc « nos hypothèses ». */
  detailTap: Array<{ libelle: string; points: number }>;
};

export type Projection = {
  annees: number[];
  factureSans: number[];
  factureAvec: number[];
  economies: number[];
  cumul: number;
  convention: Convention;
};

export type Convention = "edf" | "homeserve";

// ------------------------------------------------------------------ données

type Zone = {
  productible: number;
  zs: string;
  eligible?: boolean;
};

const ZONES = zones as unknown as Record<string, Zone>;
const BONUS = hypotheses.tap.bonus_malus_points;
const TABLE_ZONES = tapBase.zones as Record<string, number[]>;

function pointsChauffage(chauffage: Chauffage): number {
  return BONUS.chauffage[chauffage].valeur;
}

function pointsOccupation(occupation: Occupation): number {
  return BONUS.occupation[occupation].valeur;
}

function pointsChauffeEau(chauffeEau: ChauffeEau): number {
  return BONUS.chauffe_eau[chauffeEau].valeur;
}

function pointsEquipement(equipement: Equipement): number {
  const chauffeEau = CHAUFFE_EAU_EQUIPEMENT[equipement];
  if (chauffeEau) return pointsChauffeEau(chauffeEau);

  const table = BONUS.equipements as Record<string, { valeur: number }>;
  return table[equipement]?.valeur ?? 0;
}

// ------------------------------------------------------------------ TAP

function indexSurface(tranche: TrancheSurface): number {
  const i = tapBase.tranches_surface.indexOf(tranche);
  if (i < 0) throw new Error(`Tranche de surface inconnue : ${tranche}`);
  return i;
}

function indexFacture(tranche: TrancheFacture): number {
  const i = TRANCHES_FACTURE.indexOf(tranche);
  if (i < 0) throw new Error(`Tranche de facture inconnue : ${tranche}`);
  return i;
}

function lireZone(dept: string): Zone {
  const zone = ZONES[dept];
  if (!zone) throw new Error(`Département inconnu : ${dept}`);
  return zone;
}

function baseTap(zone: Zone, surface: TrancheSurface): number {
  const ligne = TABLE_ZONES[zone.zs];
  if (!ligne) throw new Error(`Zone d'ensoleillement inconnue : ${zone.zs}`);

  const base = ligne[indexSurface(surface)];
  if (base === undefined) {
    throw new Error(`Base TAP absente pour ${zone.zs} / ${surface}`);
  }
  return base;
}

function clamp(valeur: number, min: number, max: number): number {
  return Math.min(Math.max(valeur, min), max);
}

/** Arrondi à 2 décimales : évite les 29,939999999 de l'arithmétique flottante. */
function arrondi2(valeur: number): number {
  return Math.round(valeur * 100) / 100;
}

/**
 * Points d'équipements. Une borne de recharge cochée sans véhicule vaut un
 * véhicule implicite (+8,9) — et jamais un double bonus si les deux sont
 * cochés (la borne pèse alors 0).
 */
function pointsEquipements(equipements: Equipement[]): Array<{
  libelle: string;
  points: number;
}> {
  const detail: Array<{ libelle: string; points: number }> = [];
  const aVehicule = equipements.includes("vehicule_electrique");
  // Les deux chauffe-eau sont exclusifs à l'écran ; si les deux arrivaient
  // quand même, on n'en compte qu'un.
  let chauffeEauCompte = false;

  for (const equipement of equipements) {
    if (equipement === "aucun") continue;
    if (equipement === "borne_de_recharge" && aVehicule) continue;

    if (CHAUFFE_EAU_EQUIPEMENT[equipement]) {
      if (chauffeEauCompte) continue;
      chauffeEauCompte = true;
    }

    const points =
      equipement === "borne_de_recharge" && !aVehicule
        ? pointsEquipement("vehicule_electrique")
        : pointsEquipement(equipement);

    if (points !== 0) detail.push({ libelle: equipement, points });
  }

  return detail;
}

export function simulerSolaire(
  entrees: EntreesSolaire,
  options: OptionsSolaire = {},
): SolaireResult {
  const zone = lireZone(entrees.dept);
  const { stockage = "aucun", couplagePac = false } = options;

  const factureAnnuelle =
    hypotheses.tap.facture_annuelle_par_tranche.valeurs[
      indexFacture(entrees.facture_mensuelle)
    ]!;

  // --- TAP : base(zone, surface) + Σ bonus/malus, borné à [12, 63]
  const base = baseTap(zone, entrees.surface_sol);
  const detailTap: Array<{ libelle: string; points: number }> = [
    { libelle: `base ${zone.zs} / ${entrees.surface_sol}`, points: base },
  ];

  // Le couplage PAC pilotée par le HEMS déplace la consommation en journée :
  // le coefficient de chauffage devient +3,0 au lieu du malus −9,2.
  const pointsChauffageEffectifs = couplagePac
    ? hypotheses.couplage_solaire_pac.bonus_tap_pac_pilotee_points.valeur
    : pointsChauffage(entrees.chauffage);

  detailTap.push({
    libelle: couplagePac ? "PAC pilotée (couplage)" : entrees.chauffage,
    points: pointsChauffageEffectifs,
  });
  detailTap.push({
    libelle: entrees.occupation,
    points: pointsOccupation(entrees.occupation),
  });
  detailTap.push(...pointsEquipements(entrees.equipements));

  const somme = detailTap.reduce((total, ligne) => total + ligne.points, 0);
  const tapPct = arrondi2(
    clamp(somme, hypotheses.tap.min, hypotheses.tap.max),
  );

  const tapBatteriePct = arrondi2(
    Math.min(
      tapPct + hypotheses.stockage.tap_bonus_batterie_points.valeur,
      hypotheses.stockage.tap_max_batterie.valeur,
    ),
  );

  const tapEffectifPct = stockage === "aucun" ? tapPct : tapBatteriePct;

  // D55 : le stockage virtuel est un abonnement, pas un équipement. Il se
  // déduit des économies, année après année, sans être inflaté.
  const abonnementStockageAn =
    stockage === "virtuel"
      ? hypotheses.stockage.virtuel_mensuel_ttc.valeur * 12
      : 0;

  const economiesAn =
    Math.round((factureAnnuelle * tapEffectifPct) / 100) - abonnementStockageAn;

  // --- Dimensionnement : indice = tranche surface + tranche facture
  const indice =
    indexSurface(entrees.surface_sol) + indexFacture(entrees.facture_mensuelle);
  const kwcConseille: Kwc =
    options.kwc ?? (indice <= 3 ? 3 : indice <= 6 ? 6 : 9);

  const pack = hypotheses.packs_homeserve.liste.find(
    (p) => p.kwc === kwcConseille,
  );
  if (!pack) throw new Error(`Aucun pack HomeServe pour ${kwcConseille} kWc`);

  // --- Production, surplus, reste à charge, retour
  const productionKwhAn = Math.round(kwcConseille * zone.productible);
  const surplusAn =
    Math.round(
      productionKwhAn *
        (1 - tapEffectifPct / 100) *
        hypotheses.energie.prix_surplus_kwh.valeur *
        100,
    ) / 100;

  const aides =
    hypotheses.aides_solaire.prime_autoconsommation_eur_par_kwc.valeur *
    kwcConseille;
  const resteACharge = Math.max(pack.prix_ttc - aides, 0);
  const gainAn = economiesAn + surplusAn;
  const retourAns = gainAn > 0 ? arrondi2(resteACharge / gainAn) : Infinity;

  return {
    factureAnnuelle,
    tapPct,
    tapBatteriePct,
    tapEffectifPct,
    economiesAn,
    abonnementStockageAn,
    kwcConseille,
    prixPack: pack.prix_ttc,
    nomPack: pack.nom,
    productionKwhAn,
    surplusAn,
    aides,
    resteACharge,
    retourAns,
    horsZone: zone.eligible === false,
    zoneEnsoleillement: zone.zs,
    productibleKwhParKwc: zone.productible,
    detailTap,
  };
}

// ------------------------------------------------------------ projection

export type ParametresProjection = {
  factureAnnuelle: number;
  tapPct: number;
  tauxHausse: number;
  horizon: number;
  convention?: Convention;
  /**
   * D55 : abonnement annuel à déduire des économies (stockage virtuel). Il
   * n'est pas inflaté : c'est un prix d'abonnement, pas un prix du kWh.
   */
  abonnementAn?: number;
};

/**
 * Effet ciseaux : la facture et les économies sont inflatées au même taux,
 * avec `Math.ceil` à chaque itération (convention EDF).
 *
 * Deux conventions :
 * - `homeserve` — la facture affichée à l'horizon N est celle après N
 *   incréments, et le cumul somme les N années 1..N. C'est le libellé juste
 *   (« facture annuelle estimée dans N ans »).
 * - `edf` — reproduit les écrans EDF relevés : la facture affichée à
 *   l'horizon N est celle après **N+1** incréments et le cumul somme
 *   **N+1** termes. Sert la non-régression, pas l'affichage.
 */
export function projeter({
  factureAnnuelle,
  tapPct,
  tauxHausse,
  horizon,
  convention = "homeserve",
  abonnementAn = 0,
}: ParametresProjection): Projection {
  const annees: number[] = [];
  const factureSans: number[] = [];
  const factureAvec: number[] = [];
  const economies: number[] = [];

  let facture = factureAnnuelle;
  if (convention === "edf") facture = Math.ceil(facture * (1 + tauxHausse));

  for (let annee = 0; annee <= horizon; annee++) {
    if (annee > 0) facture = Math.ceil(facture * (1 + tauxHausse));

    const economie = Math.round((facture * tapPct) / 100) - abonnementAn;

    annees.push(annee);
    factureSans.push(facture);
    factureAvec.push(facture - economie);
    economies.push(economie);
  }

  // HomeServe cumule les années 1..N ; EDF cumule les N+1 termes.
  const termes = convention === "edf" ? economies : economies.slice(1);
  const cumul = termes.reduce((total, economie) => total + economie, 0);

  return { annees, factureSans, factureAvec, economies, cumul, convention };
}
