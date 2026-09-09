// @vitest-environment node
/**
 * Tests du moteur PAC (engine/pac.ts) et du couplage (engine/couplage.ts).
 *
 * Les cas de non-régression sont lus dans `pac_baremes.exemples_test` : la
 * donnée reste la source de vérité, ajouter un exemple au JSON ajoute un cas.
 */
import { describe, expect, it } from "vitest";

import baremes from "@/data/pac-baremes.json";
import { simulerCouplage } from "@/engine/couplage";
import {
  depenseChauffageDepuisFacture,
  prixKwh,
  simulerPac,
  type EnergieChauffage,
  type EntreesPac,
  type ProfilRevenus,
} from "@/engine/pac";
import { simulerSolaire, type EntreesSolaire, type TrancheSurface } from "@/engine/solaire";

type ExempleEntrees = {
  energie: string;
  depense_chauffage_an: number;
  surface_tranche: string;
  dept: string;
  profil: string;
  logement_plus_15_ans: boolean;
  logement_plus_2_ans?: boolean;
};

function entreesDe(e: ExempleEntrees): EntreesPac {
  return {
    energie: e.energie as EnergieChauffage,
    depenseChauffageAn: e.depense_chauffage_an,
    surfaceTranche: e.surface_tranche as TrancheSurface,
    dept: e.dept,
    profil: e.profil as ProfilRevenus,
    logementPlus15Ans: e.logement_plus_15_ans,
    logementPlus2Ans: e.logement_plus_2_ans ?? true,
  };
}

/** Écart relatif en pourcentage, tolérant la valeur nulle attendue. */
function ecartPct(obtenu: number, attendu: number): number {
  if (attendu === 0) return obtenu === 0 ? 0 : Infinity;
  return Math.abs((obtenu - attendu) / attendu) * 100;
}

describe("exemples_test de data/pac-baremes.json", () => {
  for (const exemple of baremes.exemples_test) {
    describe(exemple.nom, () => {
      const r = simulerPac(entreesDe(exemple.entrees as ExempleEntrees));
      // `attendu` porte aussi des `note` en clair : on ne lit que les nombres.
      const brut = exemple.attendu as Record<string, unknown>;
      const nombre = (cle: string): number | undefined =>
        typeof brut[cle] === "number" ? (brut[cle] as number) : undefined;
      const tolerance = nombre("tolerance_pct") ?? 2;

      const champs: Array<[string, number | undefined, number]> = [
        ["kwh_utile", nombre("kwh_utile"), r.kwhUtile],
        ["conso_pac_kwh", nombre("conso_pac_kwh"), r.consoPacKwh],
        ["cout_pac_an", nombre("cout_pac_an"), r.coutPacAn],
        ["economie_an", nombre("economie_an"), r.economieAn],
        ["aides", nombre("aides"), r.aides.total],
        ["reste_a_charge", nombre("reste_a_charge"), r.resteACharge],
      ];

      for (const [nom, valeurAttendue, obtenu] of champs) {
        if (valeurAttendue === undefined) continue;

        it(`${nom} à ${tolerance} % près (attendu ${valeurAttendue})`, () => {
          expect(ecartPct(obtenu, valeurAttendue)).toBeLessThanOrEqual(
            tolerance,
          );
        });
      }

      const min = nombre("economie_an_min");
      const max = nombre("economie_an_max");
      if (min !== undefined && max !== undefined) {
        it(`économie annuelle dans la fourchette ${min}–${max}`, () => {
          expect(r.economieAn).toBeGreaterThanOrEqual(min);
          expect(r.economieAn).toBeLessThanOrEqual(max);
        });
      }
    });
  }
});

const GAZ_ANCIEN: EntreesPac = {
  energie: "gaz",
  depenseChauffageAn: 1800,
  surfaceTranche: "100-135",
  dept: "69",
  profil: "jaune",
  logementPlus15Ans: true,
  logementPlus2Ans: true,
};

describe("aides", () => {
  it("cumule MaPrimeRénov' par profil et CEE par zone climatique", () => {
    const r = simulerPac(GAZ_ANCIEN);

    expect(r.zoneClimatique).toBe("H1");
    expect(r.aides.mpr).toBe(baremes.maprimerenov_2026_pac_air_eau.par_profil.jaune);
    expect(r.aides.cee).toBe(
      baremes.cee_coup_de_pouce_pac.remplacement_fossile_par_zone.H1,
    );
  });

  it("garde le CEE sur un logement de moins de 15 ans mais perd MaPrimeRénov' (D43)", () => {
    const r = simulerPac({ ...GAZ_ANCIEN, logementPlus15Ans: false });

    expect(r.aides.mpr).toBe(0);
    expect(r.aides.cee).toBe(
      baremes.cee_coup_de_pouce_pac.remplacement_fossile_par_zone.H1,
    );
  });

  it("refuse le CEE à un logement encore en construction (D43)", () => {
    const r = simulerPac({ ...GAZ_ANCIEN, logementPlus2Ans: false });

    expect(r.aides.cee).toBe(0);
    // MaPrimeRénov' garde sa propre condition, indépendante des 2 ans.
    expect(r.aides.mpr).toBeGreaterThan(0);
  });

  it("refuse le CEE quand le chauffage remplacé est électrique (D43)", () => {
    const r = simulerPac({ ...GAZ_ANCIEN, energie: "elec", profil: "bleu" });

    expect(r.aides.cee).toBe(0);
    expect(r.aides.mpr).toBe(
      baremes.maprimerenov_2026_pac_air_eau.par_profil.bleu,
    );
  });

  it("accorde le CEE au fioul comme au gaz (D43)", () => {
    expect(simulerPac({ ...GAZ_ANCIEN, energie: "fioul" }).aides.cee).toBe(
      baremes.cee_coup_de_pouce_pac.remplacement_fossile_par_zone.H1,
    );
  });

  it("donne 0 € au profil rose, même sur un logement ancien", () => {
    expect(simulerPac({ ...GAZ_ANCIEN, profil: "rose" }).aides.mpr).toBe(0);
  });

  it("varie le CEE selon la zone climatique du département", () => {
    const h3 = simulerPac({ ...GAZ_ANCIEN, dept: "13" });

    expect(h3.zoneClimatique).toBe("H3");
    expect(h3.aides.cee).toBe(
      baremes.cee_coup_de_pouce_pac.remplacement_fossile_par_zone.H3,
    );
  });
});

describe("énergies et prix", () => {
  it("convertit le fioul par son pouvoir calorifique au litre", () => {
    expect(prixKwh("fioul")).toBeCloseTo(
      baremes.prix_energie.fioul_litre_ttc.valeur /
        baremes.prix_energie.fioul_kwh_pci_par_litre.valeur,
      6,
    );
  });

  it("chiffre une dépense fioul identique en euros mais différente en kWh", () => {
    const fioul = simulerPac({ ...GAZ_ANCIEN, energie: "fioul" });
    const gaz = simulerPac(GAZ_ANCIEN);

    expect(fioul.kwhUtile).not.toBe(gaz.kwhUtile);
    expect(fioul.economieAn).toBeGreaterThan(0);
  });

  it("refuse un département inconnu", () => {
    expect(() => simulerPac({ ...GAZ_ANCIEN, dept: "00" })).toThrow();
  });

  it("estime la dépense de chauffage depuis la tranche de facture", () => {
    // Tranche 101–135 €/mois → 1 416 €/an, dont 65 % de chauffage.
    expect(depenseChauffageDepuisFacture(2, "gaz_fioul_bois")).toBe(920);
    expect(depenseChauffageDepuisFacture(2, "radiateurs_electriques")).toBe(779);
  });
});

describe("projection sur 15 ans", () => {
  it("couvre l'horizon par défaut et cumule des économies croissantes", () => {
    const r = simulerPac(GAZ_ANCIEN, { tauxHausse: 0.04 });

    expect(r.projection.annees.at(-1)).toBe(baremes.horizon_projection_ans);
    expect(r.projection.cumul).toBeGreaterThan(r.economieAn * 15);

    for (let i = 1; i < r.projection.economies.length; i++) {
      expect(r.projection.economies[i]!).toBeGreaterThanOrEqual(
        r.projection.economies[i - 1]!,
      );
    }
  });

  it("à 0 % de hausse, le cumul vaut 15 × l'économie annuelle", () => {
    const r = simulerPac(GAZ_ANCIEN, { tauxHausse: 0 });

    expect(r.projection.cumul).toBe(15 * (1800 - r.coutPacAn));
  });
});

const SOLAIRE_LES_DEUX: EntreesSolaire = {
  dept: "69",
  occupation: "5_jours_et_plus",
  personnes: "3-4",
  surface_sol: "100-135",
  chauffage: "pompe_a_chaleur",
  equipements: ["vehicule_electrique", "chauffe_eau_thermodynamique"],
  facture_mensuelle: "101-135",
};

describe("couplage solaire + PAC", () => {
  it("remplace le malus PAC −9,2 par le bonus +3,0 dans le solaire", () => {
    const sans = simulerSolaire(SOLAIRE_LES_DEUX).tapPct;
    const couple = simulerCouplage({
      solaire: SOLAIRE_LES_DEUX,
      pac: GAZ_ANCIEN,
    }).solaire.tapPct;

    // −9,2 → +3,0 : 12,2 points gagnés.
    expect(Math.abs(couple - sans - 12.2)).toBeLessThanOrEqual(0.05);
  });

  it("réduit le coût annuel de la PAC de 25 % (autoconsommation)", () => {
    const seule = simulerPac(GAZ_ANCIEN);
    const couple = simulerCouplage({
      solaire: SOLAIRE_LES_DEUX,
      pac: GAZ_ANCIEN,
    }).pac;

    // Le moteur n'arrondit qu'une fois, en fin de calcul : on compare donc au
    // ratio à l'euro près plutôt qu'à un double arrondi.
    const attendu =
      seule.coutPacAn *
      (1 - baremes.couplage_solaire_pac.part_conso_pac_couverte.valeur);

    expect(Math.abs(couple.coutPacAn - attendu)).toBeLessThanOrEqual(1);
    expect(couple.economieAn).toBeGreaterThan(seule.economieAn);
  });

  it("expose les effets appliqués et agrège économies et reste à charge", () => {
    const r = simulerCouplage({ solaire: SOLAIRE_LES_DEUX, pac: GAZ_ANCIEN });

    expect(r.effets).toEqual({
      bonusTapPacPilotee: 3,
      partConsoPacCouverte: 0.25,
    });
    expect(r.economiesAnTotales).toBe(r.solaire.economiesAn + r.pac.economieAn);
    expect(r.resteAChargeTotal).toBe(
      r.solaire.resteACharge + r.pac.resteACharge,
    );
    expect(r.retourAns).toBeGreaterThan(0);
    expect(Number.isFinite(r.retourAns)).toBe(true);
  });

  it("laisse le solaire seul inchangé (le couplage n'est pas implicite)", () => {
    expect(simulerPac(GAZ_ANCIEN).couplageSolaire).toBe(false);
  });
});
