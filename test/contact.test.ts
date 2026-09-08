import { describe, expect, it } from "vitest";

import hypotheses from "@/data/hypotheses.json";
import {
  contactPourProjet,
  estOuvert,
  lignePourProjet,
  numeroDeLigne,
} from "@/lib/contact";

/** Instant à une heure murale de Paris donnée (septembre = CEST, +02:00). */
function parisSeptembre(jour: number, heure: number, minute = 0): Date {
  return new Date(
    `2026-09-${String(jour).padStart(2, "0")}T${String(heure).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+02:00`,
  );
}

// 2026-09-14 est un lundi.
const LUNDI = 14;
const JEUDI = 17;
const VENDREDI = 18;
const SAMEDI = 19;
const DIMANCHE = 20;

describe("horaires d'ouverture", () => {
  it("ouvert du lundi au jeudi de 10 h à 18 h", () => {
    expect(estOuvert(parisSeptembre(LUNDI, 10, 0))).toBe(true);
    expect(estOuvert(parisSeptembre(LUNDI, 14, 30))).toBe(true);
    expect(estOuvert(parisSeptembre(JEUDI, 17, 59))).toBe(true);
  });

  it("fermé avant 10 h et à partir de 18 h en semaine", () => {
    expect(estOuvert(parisSeptembre(LUNDI, 9, 59))).toBe(false);
    expect(estOuvert(parisSeptembre(LUNDI, 18, 0))).toBe(false);
    expect(estOuvert(parisSeptembre(JEUDI, 21, 0))).toBe(false);
  });

  it("le vendredi ferme à 15 h", () => {
    expect(estOuvert(parisSeptembre(VENDREDI, 14, 59))).toBe(true);
    expect(estOuvert(parisSeptembre(VENDREDI, 15, 0))).toBe(false);
    expect(estOuvert(parisSeptembre(VENDREDI, 17, 0))).toBe(false);
  });

  it("fermé le week-end", () => {
    expect(estOuvert(parisSeptembre(SAMEDI, 11, 0))).toBe(false);
    expect(estOuvert(parisSeptembre(DIMANCHE, 11, 0))).toBe(false);
  });

  it("raisonne en heure de Paris, pas en UTC", () => {
    // 08:30 UTC = 10:30 à Paris en septembre : ouvert.
    expect(estOuvert(new Date("2026-09-14T08:30:00Z"))).toBe(true);
    // 17:30 UTC = 19:30 à Paris : fermé.
    expect(estOuvert(new Date("2026-09-14T17:30:00Z"))).toBe(false);
  });
});

describe("choix de la ligne", () => {
  it("route le solaire sur la ligne solaire", () => {
    expect(lignePourProjet("solaire")).toBe("solaire");
    expect(numeroDeLigne("solaire")).toBe(hypotheses.contact.solaire);
  });

  it("route la PAC et « les deux » sur la ligne rénovation", () => {
    expect(lignePourProjet("pac")).toBe("renovation");
    expect(lignePourProjet("les_deux")).toBe("renovation");
    expect(numeroDeLigne("renovation")).toBe(hypotheses.contact.renovation);
  });

  it("retombe sur la rénovation sans projet connu", () => {
    expect(lignePourProjet(undefined)).toBe("renovation");
  });
});

describe("contactPourProjet", () => {
  it("propose l'appel pendant les horaires", () => {
    const c = contactPourProjet("solaire", parisSeptembre(LUNDI, 11));

    expect(c.ouvert).toBe(true);
    expect(c.libelle).toBe("Appeler HomeServe");
    expect(c.numeroTel).toBe(hypotheses.contact.solaire.replace(/\s/g, ""));
    expect(c.mention).toContain(hypotheses.contact.horaires.libelle);
  });

  it("propose le rappel hors horaires, avec les horaires en clair", () => {
    const c = contactPourProjet("pac", parisSeptembre(SAMEDI, 11));

    expect(c.ouvert).toBe(false);
    expect(c.libelle).toBe("Être rappelé");
    expect(c.mention).toContain(hypotheses.contact.horaires.libelle);
  });
});
