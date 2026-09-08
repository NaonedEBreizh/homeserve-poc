// @vitest-environment node
/**
 * Tests de l'agenda simulé (engine/agenda.ts).
 * Contrat :
 *   trouverAgence(cp: string, agences): { agence, distanceKm } | null      // plus proche ≤ 60 km ; CP 99999 → agence TEST
 *   genererCreneaux(agence, { seed: string, aujourdhui: Date, horizonJours, delaiMinJoursOuvres, dureeMin }): Creneau[]
 *   estSurbookee(creneaux, { fenetreJours, seuil, aujourdhui }): boolean
 *   genererIcs(rdv: { debut: Date, dureeMin, titre, lieu, description, uid }): string
 */
import { describe, expect, it } from "vitest";

import agencesJson from "@/data/agences.json";
import { estSurbookee, genererCreneaux, genererIcs, trouverAgence } from "@/engine/agenda";

const agences = agencesJson.agences;
const LUNDI = new Date("2026-09-14T09:00:00+02:00"); // lundi

describe("trouverAgence", () => {
  it("route Lyon sur l'agence LYO", () => {
    expect(trouverAgence("69002", agences)?.agence.id).toBe("LYO");
  });
  it("renvoie null pour un CP sans agence à 60 km (ex. Strasbourg 67000)", () => {
    expect(trouverAgence("67000", agences)).toBeNull();
  });
  it("route le CP de test 99999 sur l'agence TEST", () => {
    expect(trouverAgence("99999", agences)?.agence.id).toBe("TEST");
  });
});

describe("genererCreneaux", () => {
  const lyo = agences.find((a) => a.id === "LYO")!;
  const params = { seed: "69002", aujourdhui: LUNDI, horizonJours: 14, delaiMinJoursOuvres: 1, dureeMin: 60 };

  it("est déterministe pour un même seed", () => {
    const a = genererCreneaux(lyo, params);
    const b = genererCreneaux(lyo, params);
    expect(a.map((c) => c.debut.toISOString())).toEqual(b.map((c) => c.debut.toISOString()));
  });

  it("change avec le seed", () => {
    const a = genererCreneaux(lyo, params).map((c) => c.debut.toISOString()).join();
    const b = genererCreneaux(lyo, { ...params, seed: "69100" }).map((c) => c.debut.toISOString()).join();
    expect(a).not.toEqual(b);
  });

  it("ne propose rien avant J+1 ouvré ni au-delà de 14 jours, ni le week-end", () => {
    const cs = genererCreneaux(lyo, params);
    expect(cs.length).toBeGreaterThan(0);
    for (const c of cs) {
      const jours = (c.debut.getTime() - LUNDI.getTime()) / 86_400_000;
      expect(jours).toBeGreaterThanOrEqual(1);
      expect(jours).toBeLessThanOrEqual(14);
      expect([0, 6]).not.toContain(c.debut.getDay());
      expect(c.dureeMin).toBe(60);
      expect(["matin", "apres_midi"]).toContain(c.periode);
    }
  });

  it("utilise les heures de début de l'agence", () => {
    const cs = genererCreneaux(lyo, params);
    const heures = new Set(cs.map((c) => c.debut.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })));
    for (const h of heures) expect(lyo.creneaux_debut).toContain(h);
  });
});

describe("estSurbookee (D30)", () => {
  it("l'agence TEST est surbookée : < 4 créneaux libres sur 10 jours", () => {
    const test = agences.find((a) => a.id === "TEST")!;
    const cs = genererCreneaux(test, { seed: "99999", aujourdhui: LUNDI, horizonJours: 14, delaiMinJoursOuvres: 1, dureeMin: 60 });
    expect(estSurbookee(cs, { fenetreJours: 10, seuil: 4, aujourdhui: LUNDI })).toBe(true);
  });
  it("Lyon n'est pas surbookée", () => {
    const lyo = agences.find((a) => a.id === "LYO")!;
    const cs = genererCreneaux(lyo, { seed: "69002", aujourdhui: LUNDI, horizonJours: 14, delaiMinJoursOuvres: 1, dureeMin: 60 });
    expect(estSurbookee(cs, { fenetreJours: 10, seuil: 4, aujourdhui: LUNDI })).toBe(false);
  });
});

describe("genererIcs", () => {
  it("produit un VEVENT valide en Europe/Paris", () => {
    const ics = genererIcs({ debut: new Date("2026-09-16T08:30:00+02:00"), dureeMin: 60, titre: "Visite technique HomeServe", lieu: "1 place Bellecour, 69002 Lyon", description: "Prototype — aucune donnée transmise", uid: "test-uid@homeserve-poc" });
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("TZID=Europe/Paris");
    expect(ics).toMatch(/DTSTART;TZID=Europe\/Paris:20260916T083000/);
    expect(ics).toMatch(/DTEND;TZID=Europe\/Paris:20260916T093000/);
    expect(ics).toContain("UID:test-uid@homeserve-poc");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics.split("\n").every((l) => l.length <= 75 || l.startsWith(" "))).toBe(true);
  });
});
