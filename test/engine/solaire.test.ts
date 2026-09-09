// @vitest-environment node
/**
 * Tests du moteur solaire (engine/solaire.ts) — écrits AVANT le moteur.
 * Ils définissent le contrat ; Claude Code implémente jusqu'au vert.
 *
 * Contrat attendu :
 *   simulerSolaire(entrees: EntreesSolaire, options?: OptionsSolaire): SolaireResult
 *   projeter(params: { factureAnnuelle, tapPct, tauxHausse, horizon, convention?: "edf" | "homeserve", abonnementAn?: number }): Projection
 *
 * Sources : docs/retro-ingenierie-edf.md §1.2, docs/releve-simulateur-edf.md §3,
 * data/hypotheses.json, data/tap-base.json, data/zones.json.
 */
import { describe, expect, it } from "vitest";

import { projeter, simulerSolaire, type EntreesSolaire } from "@/engine/solaire";
import hypotheses from "@/data/hypotheses.json";

const EXEMPLE_EDF: EntreesSolaire = {
  dept: "69",
  occupation: "5_jours_et_plus",
  personnes: "3-4",
  surface_sol: "100-135",
  chauffage: "radiateurs_electriques",
  // D53 : le chauffe-eau est désormais une case de A6.
  equipements: ["vehicule_electrique", "chauffe_eau_thermodynamique"],
  facture_mensuelle: "101-135",
};

describe("simulerSolaire — non-régression sur l'exemple EDF vérifié", () => {
  const r = simulerSolaire(EXEMPLE_EDF);

  it("retrouve la facture annuelle de la tranche 101–135 €", () => {
    expect(r.factureAnnuelle).toBe(1416);
  });

  it("retrouve le taux d'autoproduction 29,94 % à 0,1 pt près", () => {
    expect(Math.abs(r.tapPct - 29.94)).toBeLessThanOrEqual(0.1);
  });

  it("retrouve les économies annuelles ≈ 424 €", () => {
    expect(Math.abs(r.economiesAn - 424)).toBeLessThanOrEqual(1);
  });

  it("calcule le TAP batterie = TAP + 21 pts (50,94), plafonné à 84", () => {
    expect(Math.abs(r.tapBatteriePct - 50.94)).toBeLessThanOrEqual(0.1);
    expect(r.tapBatteriePct).toBeLessThanOrEqual(hypotheses.stockage.tap_max_batterie.valeur);
  });

  it("conseille un pack HomeServe existant avec son prix public", () => {
    expect([3, 6, 9]).toContain(r.kwcConseille);
    const pack = hypotheses.packs_homeserve.liste.find((p) => p.kwc === r.kwcConseille);
    expect(r.prixPack).toBe(pack?.prix_ttc);
  });

  it("expose une production annuelle cohérente avec le productible du département", () => {
    // Rhône : ~1 150 kWh/kWc/an (data/zones.json)
    expect(r.productionKwhAn).toBeGreaterThan(r.kwcConseille * 1000);
    expect(r.productionKwhAn).toBeLessThan(r.kwcConseille * 1300);
  });

  it("donne un temps de retour positif et fini", () => {
    expect(r.retourAns).toBeGreaterThan(0);
    expect(Number.isFinite(r.retourAns)).toBe(true);
  });
});

describe("simulerSolaire — bornes et coefficients", () => {
  it("borne le TAP entre 12 et 63 quels que soient les bonus", () => {
    const bas = simulerSolaire({ ...EXEMPLE_EDF, dept: "59", surface_sol: "<70", chauffage: "pompe_a_chaleur", equipements: [], occupation: "moins_de_3_jours" });
    expect(bas.tapPct).toBeGreaterThanOrEqual(12);
    const haut = simulerSolaire({ ...EXEMPLE_EDF, dept: "13", surface_sol: ">175", chauffage: "gaz_fioul_bois", equipements: ["vehicule_electrique", "climatisation", "piscine_ou_jacuzzi", "lave_vaisselle", "seche_linge", "chauffage_secondaire", "chauffe_eau_electrique"] });
    expect(haut.tapPct).toBeLessThanOrEqual(63);
  });

  it("applique le malus PAC (−9,2) par rapport aux radiateurs électriques", () => {
    const elec = simulerSolaire(EXEMPLE_EDF).tapPct;
    const pac = simulerSolaire({ ...EXEMPLE_EDF, chauffage: "pompe_a_chaleur" }).tapPct;
    expect(Math.abs(elec - pac - 9.2)).toBeLessThanOrEqual(0.05);
  });

  it("applique le bonus véhicule électrique (+8,9)", () => {
    const sans = simulerSolaire({
      ...EXEMPLE_EDF,
      equipements: ["chauffe_eau_thermodynamique"],
    }).tapPct;
    const avec = simulerSolaire(EXEMPLE_EDF).tapPct;
    expect(Math.abs(avec - sans - 8.9)).toBeLessThanOrEqual(0.05);
  });

  it("une borne sans véhicule vaut un véhicule implicite (+8,9), pas un double bonus", () => {
    const borneSeule = simulerSolaire({ ...EXEMPLE_EDF, equipements: ["borne_de_recharge", "chauffe_eau_thermodynamique"] }).tapPct;
    const vehiculeEtBorne = simulerSolaire({ ...EXEMPLE_EDF, equipements: ["vehicule_electrique", "borne_de_recharge", "chauffe_eau_thermodynamique"] }).tapPct;
    expect(Math.abs(borneSeule - vehiculeEtBorne)).toBeLessThanOrEqual(0.05);
  });

  it("le couplage PAC remplace le malus −9,2 par +3,0", () => {
    const sans = simulerSolaire({ ...EXEMPLE_EDF, chauffage: "pompe_a_chaleur" }).tapPct;
    const avec = simulerSolaire({ ...EXEMPLE_EDF, chauffage: "pompe_a_chaleur" }, { couplagePac: true }).tapPct;
    expect(Math.abs(avec - sans - 12.2)).toBeLessThanOrEqual(0.05);
  });

  it("le stockage virtuel ou la batterie utilise le TAP batterie", () => {
    const base = simulerSolaire(EXEMPLE_EDF);
    const batt = simulerSolaire(EXEMPLE_EDF, { stockage: "batterie" });
    expect(batt.economiesAn).toBeGreaterThan(base.economiesAn);
    expect(Math.abs(batt.economiesAn - Math.round((1416 * batt.tapBatteriePct) / 100))).toBeLessThanOrEqual(1);
    // La batterie physique est sur devis : rien n'est déduit (D55).
    expect(batt.abonnementStockageAn).toBe(0);
  });

  it("D55 : le stockage virtuel déduit son abonnement des économies", () => {
    const abonnement = hypotheses.stockage.virtuel_mensuel_ttc.valeur * 12;
    const batt = simulerSolaire(EXEMPLE_EDF, { stockage: "batterie" });
    const virt = simulerSolaire(EXEMPLE_EDF, { stockage: "virtuel" });

    // Même TAP que la batterie, mais 180 € de moins par an.
    expect(virt.tapEffectifPct).toBe(batt.tapEffectifPct);
    expect(virt.abonnementStockageAn).toBe(abonnement);
    expect(virt.economiesAn).toBe(batt.economiesAn - abonnement);
  });

  it("D55 : l'abonnement se déduit de chaque année du cumul", () => {
    const abonnement = hypotheses.stockage.virtuel_mensuel_ttc.valeur * 12;
    const horizon = 25;
    const commun = {
      factureAnnuelle: 1416,
      tapPct: 50.94,
      tauxHausse: 0.04,
      horizon,
      convention: "homeserve" as const,
    };

    const sans = projeter(commun);
    const avec = projeter({ ...commun, abonnementAn: abonnement });

    // Un abonnement constant, jamais inflaté : N années × 180 €.
    expect(sans.cumul - avec.cumul).toBe(horizon * abonnement);
  });

  it("un département hors zone calcule quand même mais le signale", () => {
    const r = simulerSolaire({ ...EXEMPLE_EDF, dept: "75" });
    expect(r.economiesAn).toBeGreaterThan(0);
    expect(r.horsZone).toBe(true);
  });

  it("refuse un département inconnu", () => {
    expect(() => simulerSolaire({ ...EXEMPLE_EDF, dept: "00" })).toThrow();
  });
});

describe("projeter — effet ciseaux", () => {
  it("à 0 % de hausse, le cumul HomeServe sur N ans vaut N × économies annuelles", () => {
    const p = projeter({ factureAnnuelle: 1416, tapPct: 29.94, tauxHausse: 0, horizon: 25, convention: "homeserve" });
    expect(p.cumul).toBe(25 * Math.round((1416 * 29.94) / 100));
    expect(p.factureSans.at(-1)).toBe(1416);
  });

  it("à 4 %, la facture sans solaire dépasse la facture avec, et l'écart croît chaque année", () => {
    const p = projeter({ factureAnnuelle: 1416, tapPct: 29.94, tauxHausse: 0.04, horizon: 30, convention: "homeserve" });
    for (let i = 1; i < p.annees.length; i++) {
      const ecart = p.factureSans[i]! - p.factureAvec[i]!;
      const ecartPrec = p.factureSans[i - 1]! - p.factureAvec[i - 1]!;
      expect(ecart).toBeGreaterThanOrEqual(ecartPrec);
    }
  });

  it("le cumul croît avec le taux de hausse (chaque point compte)", () => {
    const c4 = projeter({ factureAnnuelle: 1416, tapPct: 29.94, tauxHausse: 0.04, horizon: 25, convention: "homeserve" }).cumul;
    const c6 = projeter({ factureAnnuelle: 1416, tapPct: 29.94, tauxHausse: 0.06, horizon: 25, convention: "homeserve" }).cumul;
    expect(c6).toBeGreaterThan(c4);
  });

  it("reproduit les écrans EDF réels avec la convention EDF (N+1 incréments, cumul N+1 termes)", () => {
    // Relevé docs/releve-simulateur-edf.md §3 : facture 2 280 €, TAP ≈ 23,2 %, 4 %, 10 ans → sans 3 516 €, cumul 7 395 €
    const p = projeter({ factureAnnuelle: 2280, tapPct: 23.2, tauxHausse: 0.04, horizon: 10, convention: "edf" });
    expect(Math.abs(p.factureSans.at(-1)! - 3516)).toBeLessThanOrEqual(10);
    expect(Math.abs(p.cumul - 7395)).toBeLessThanOrEqual(60);
  });

  it("l'horizon est l'un des 5 proposés et les années sont échantillonnées", () => {
    expect(hypotheses.projection.horizons_ans).toEqual([10, 15, 20, 25, 30]);
    const p = projeter({ factureAnnuelle: 1416, tapPct: 30, tauxHausse: 0.04, horizon: 20, convention: "homeserve" });
    expect(p.annees[0]).toBe(0);
    expect(p.annees.at(-1)).toBe(20);
  });
});
