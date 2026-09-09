import { describe, expect, it } from "vitest";

import agencesJson from "@/data/agences.json";
import zonesJson from "@/data/zones.json";
import { contenu } from "@/lib/content";

type Meta = { date: string; sources: string[] };

type Zone = {
  nom: string;
  zc: string;
  zcSimple: string;
  productible: number;
  zs: string;
  eligible: boolean;
};

type Agence = {
  id: string;
  nom: string;
  dept: string;
  depts: string[];
  competences: string[];
  self_booking_actif: boolean;
  seuil_surbooking: number;
  horizon_jours: number;
  delai_min_jours_ouvres: number;
  duree_visite_min: number;
  jours_travailles: number[];
  creneaux_debut: string[];
};

const zones = zonesJson as unknown as Record<string, unknown> & { _meta: Meta };
const agences = agencesJson as unknown as { _meta: Meta; agences: Agence[] };

// `_meta` cohabite avec les départements dans le même objet : on l'écarte
// explicitement pour obtenir une liste typée.
const departements: Array<[string, Zone]> = Object.entries(zones)
  .filter(([code]) => code !== "_meta")
  .map(([code, zone]) => [code, zone as Zone]);

const zoneParDept = new Map<string, Zone>(departements);

describe("data/zones.json", () => {
  it("se charge et couvre les départements métropolitains", () => {
    expect(departements.length).toBeGreaterThanOrEqual(96);
  });

  it("est daté et sourcé", () => {
    expect(zones._meta.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(zones._meta.sources.length).toBeGreaterThan(0);
  });

  it("décrit chaque département avec les champs attendus par les moteurs", () => {
    for (const [code, zone] of departements) {
      expect(code, `code ${code}`).toMatch(/^(\d{2}|2A|2B)$/);
      expect(zone.zc, `zc de ${code}`).toMatch(/^H[123][a-d]?$/);
      expect(zone.zcSimple, `zcSimple de ${code}`).toMatch(/^H[123]$/);
      expect(zone.zs, `zs de ${code}`).toMatch(/^Z[1-5]$/);
      expect(zone.productible, `productible de ${code}`).toBeGreaterThanOrEqual(950);
      expect(zone.productible, `productible de ${code}`).toBeLessThanOrEqual(1420);
      expect(typeof zone.eligible, `eligible de ${code}`).toBe("boolean");
    }
  });

  it("porte le département 69 utilisé par la non-régression EDF", () => {
    const rhone = zoneParDept.get("69");

    expect(rhone).toBeDefined();
    expect(rhone?.eligible).toBe(true);
    expect(rhone?.zcSimple).toBe("H1");
  });
});

describe("data/agences.json", () => {
  it("se charge, est daté et sourcé", () => {
    expect(agences.agences.length).toBeGreaterThan(0);
    expect(agences._meta.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(agences._meta.sources.length).toBeGreaterThan(0);
  });

  it("expose des identifiants uniques", () => {
    const ids = agences.agences.map((agence) => agence.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("décrit l'agenda de chaque agence (règle D31)", () => {
    for (const agence of agences.agences) {
      expect(agence.duree_visite_min, agence.id).toBe(60);
      expect(agence.horizon_jours, agence.id).toBe(14);
      expect(agence.delai_min_jours_ouvres, agence.id).toBeGreaterThanOrEqual(1);
      expect(agence.creneaux_debut.length, agence.id).toBeGreaterThan(0);
      expect(agence.competences.length, agence.id).toBeGreaterThan(0);

      for (const jour of agence.jours_travailles) {
        expect(jour, `jour travaillé de ${agence.id}`).toBeGreaterThanOrEqual(1);
        expect(jour, `jour travaillé de ${agence.id}`).toBeLessThanOrEqual(7);
      }
    }
  });

  it("couvre chaque département servi par une zone connue", () => {
    const codesZones = new Set(departements.map(([code]) => code));

    for (const agence of agences.agences) {
      if (agence.id === "TEST") continue;

      for (const dept of agence.depts) {
        expect(codesZones.has(dept), `${agence.id} sert ${dept}`).toBe(true);
      }
    }
  });

  it("embarque l'agence TEST surbookée du code postal 99999 (règle D30)", () => {
    const test = agences.agences.find((agence) => agence.id === "TEST");

    expect(test).toBeDefined();
    expect(test?.seuil_surbooking).toBe(4);
  });
});

describe("libellés de données (lot 5)", () => {
  it("le gabarit d'agence ne préfixe pas un nom qui dit déjà « Agence »", () => {
    const gabarit = contenu.rdv.calendrier.agence;
    expect(gabarit.startsWith("{nom}")).toBe(true);

    const test = (agencesJson.agences as Agence[]).find((a) => a.id === "TEST");
    expect(test).toBeDefined();
    const rendu = gabarit
      .replace("{nom}", test!.nom)
      .replace("{km}", "0");
    expect(rendu).toBe("Agence de test surbookée — à 0 km");
    expect(/Agence\s+Agence/.test(rendu)).toBe(false);
  });
});
