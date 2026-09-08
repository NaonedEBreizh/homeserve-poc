// @vitest-environment node
/**
 * Tests de l'interpréteur de la machine à états (engine/machine.ts) et de data/arbre-rdv.json.
 * Contrat :
 *   creerMachine(arbre, { prefill?: Record<string,string>, projet?: "solaire"|"pac"|"les_deux", contexte?: { rdvExistants?: Array<{telephone,email}> } }): Machine
 *   machine.courant(): { type: "noeud", id, noeud } | { type: "sortie", code, sortie }
 *   machine.repondre(valeur | Record<string,string>): void   // choix, multi, form, otp
 *   machine.retour(): void
 *   machine.etat(): { reponses, nonEligible: string[], historique: string[], notesTechnicien: string[] }
 * Les nœuds de type "regle" et "info" s'enchaînent via machine.avancer().
 */
import { describe, expect, it } from "vitest";

import arbre from "@/data/arbre-rdv.json";
import { creerMachine } from "@/engine/machine";

function repondreJusqua(m: ReturnType<typeof creerMachine>, reponses: Array<[string, string | Record<string, string>]>) {
  for (const [id, valeur] of reponses) {
    const c = m.courant();
    expect(c.type).toBe("noeud");
    if (c.type === "noeud") expect(c.id).toBe(id);
    m.repondre(valeur);
  }
}

describe("sorties immédiates", () => {
  it("appartement → S2", () => {
    const m = creerMachine(arbre);
    m.repondre("appartement");
    expect(m.courant()).toMatchObject({ type: "sortie", code: "S2" });
  });
  it("local professionnel → S1", () => {
    const m = creerMachine(arbre);
    m.repondre("pro");
    expect(m.courant()).toMatchObject({ type: "sortie", code: "S1" });
  });
  it("locataire → S3", () => {
    const m = creerMachine(arbre);
    repondreJusqua(m, [["B0", "maison"], ["B1", "locataire"]]);
    expect(m.courant()).toMatchObject({ type: "sortie", code: "S3" });
  });
  it("panneaux d'un autre installateur → S4c", () => {
    const m = creerMachine(arbre);
    repondreJusqua(m, [["B0", "maison"], ["B1", "proprietaire"], ["B2", "oui"], ["B2a", "non"]]);
    expect(m.courant()).toMatchObject({ type: "sortie", code: "S4c" });
  });
});

describe("règle de non-répétition (prefill depuis le simulateur)", () => {
  it("saute projet, facture, surface et année quand ils sont hérités, mais évalue leurs règles", () => {
    const m = creerMachine(arbre, {
      projet: "solaire",
      prefill: { projet: "solaire", facture_mensuelle: "<60", surface_sol: "100-135", annee_construction: ">2010", cp: "69001" },
    });
    repondreJusqua(m, [["B0", "maison"], ["B1", "proprietaire"], ["B2", "non"]]);
    // B3 (projet) et B5 (facture) sautés → on arrive en B6 (résidence)
    expect(m.courant()).toMatchObject({ type: "noeud", id: "B6" });
    expect(m.etat().nonEligible).toContain("facture_faible");
    m.repondre("principale");
    // B7 (surface) et B9 (année) sautés → B10 (toiture)
    expect(m.courant()).toMatchObject({ type: "noeud", id: "B10" });
  });

  it("sans prefill, toutes les questions sont posées (porte chaude)", () => {
    const m = creerMachine(arbre);
    repondreJusqua(m, [["B0", "maison"], ["B1", "proprietaire"], ["B2", "non"]]);
    expect(m.courant()).toMatchObject({ type: "noeud", id: "B3" });
  });
});

describe("règles d'éligibilité P(e)", () => {
  it("résidence secondaire et surface < 70 (solaire) ajoutent des règles sans arrêter le parcours", () => {
    const m = creerMachine(arbre, { projet: "solaire" });
    repondreJusqua(m, [["B0", "maison"], ["B1", "proprietaire"], ["B2", "non"], ["B3", "solaire"], ["B5", "101-135"], ["B6", "secondaire"], ["B7", "<70"]]);
    expect(m.etat().nonEligible).toEqual(expect.arrayContaining(["residence_secondaire", "surface_faible"]));
    expect(m.courant().type).toBe("noeud");
  });

  it("surface < 70 ne disqualifie pas un projet PAC seul", () => {
    const m = creerMachine(arbre, { projet: "pac" });
    repondreJusqua(m, [["B0", "maison"], ["B1", "proprietaire"], ["B2", "non"], ["B3", "pac"], ["B5", "101-135"], ["B6", "principale"], ["B7", "<70"]]);
    expect(m.etat().nonEligible).not.toContain("surface_faible");
  });
});

describe("sous-arbres par projet", () => {
  it("projet PAC : pas de questions toiture, mais émetteurs et espace extérieur", () => {
    const m = creerMachine(arbre, { projet: "pac" });
    repondreJusqua(m, [["B0", "maison"], ["B1", "proprietaire"], ["B2", "non"], ["B3", "pac"], ["B5", "101-135"], ["B6", "principale"], ["B7", "100-135"], ["B9", "<1997"]]);
    expect(m.courant()).toMatchObject({ type: "noeud", id: "B10p" });
  });

  it("projet solaire : toit d'origine avant 1997 → question amiante ; amiante oui → S5", () => {
    const m = creerMachine(arbre, { projet: "solaire" });
    repondreJusqua(m, [["B0", "maison"], ["B1", "proprietaire"], ["B2", "non"], ["B3", "solaire"], ["B5", "101-135"], ["B6", "principale"], ["B7", "100-135"], ["B9", "<1997"], ["B10", "origine"], ["B11", "oui"]]);
    expect(m.courant()).toMatchObject({ type: "sortie", code: "S5" });
  });
});

describe("garde géographique (B14)", () => {
  function jusquaAdresse(projet: "solaire" = "solaire") {
    const m = creerMachine(arbre, { projet });
    repondreJusqua(m, [["B0", "maison"], ["B1", "proprietaire"], ["B2", "non"], ["B3", projet], ["B5", "101-135"], ["B6", "principale"], ["B7", "100-135"], ["B9", ">2010"], ["B10", "renovee"], ["B12", "tuile"]]);
    expect(m.courant()).toMatchObject({ type: "noeud", id: "B14" });
    return m;
  }
  it("Paris (75) → S6 territoire non couvert", () => {
    const m = jusquaAdresse();
    m.repondre({ adresse: "1 rue de Test", cp: "75001", ville: "Paris" });
    expect(m.courant()).toMatchObject({ type: "sortie", code: "S6" });
  });
  it("Lyon (69001) → coordonnées", () => {
    const m = jusquaAdresse();
    m.repondre({ adresse: "1 place Bellecour", cp: "69002", ville: "Lyon" });
    expect(m.courant()).toMatchObject({ type: "noeud", id: "B15" });
  });
  it("le CP de test 99999 passe la garde (agence TEST surbookée)", () => {
    const m = jusquaAdresse();
    m.repondre({ adresse: "1 rue Test", cp: "99999", ville: "Ville-Test" });
    expect(m.courant()).toMatchObject({ type: "noeud", id: "B15" });
  });
});

describe("règles simulées post-OTP (D29, D30, D32)", () => {
  function jusquaOtp(cp = "69002", rdvExistants: Array<{ telephone: string; email: string }> = []) {
    const m = creerMachine(arbre, { projet: "solaire", contexte: { rdvExistants } });
    repondreJusqua(m, [["B0", "maison"], ["B1", "proprietaire"], ["B2", "non"], ["B3", "solaire"], ["B5", "101-135"], ["B6", "principale"], ["B7", "100-135"], ["B9", ">2010"], ["B10", "renovee"], ["B12", "tuile"]]);
    m.repondre({ adresse: "1 place Bellecour", cp, ville: "Lyon" });
    m.repondre({ prenom: "Test", nom: "Demo" });
    return m;
  }

  it("un RDV existant avec le même téléphone → DOUBLON", () => {
    const m = jusquaOtp("69002", [{ telephone: "0600000009", email: "autre@example.org" }]);
    m.repondre({ email: "test@example.org", telephone: "06 00 00 00 09", ne_pas_appeler: "false" });
    m.repondre("4821");
    m.avancer();
    expect(m.courant()).toMatchObject({ type: "sortie", code: "DOUBLON" });
  });

  it("le téléphone de test 0600000001 → écran B17c puis poursuite vers l'éligibilité", () => {
    const m = jusquaOtp();
    m.repondre({ email: "test@example.org", telephone: "0600000001", ne_pas_appeler: "false" });
    m.repondre("4821");
    m.avancer();
    expect(m.courant()).toMatchObject({ type: "noeud", id: "B17c" });
    m.avancer();
    m.avancer(); // B18 éligible → B19
    expect(m.courant()).toMatchObject({ type: "noeud", id: "B19" });
  });

  it("le code postal de test 99999 → agence surbookée → SURBOOKEE", () => {
    const m = jusquaOtp("99999");
    m.repondre({ email: "test@example.org", telephone: "0600000002", ne_pas_appeler: "false" });
    m.repondre("4821");
    m.avancer(); // B17b → B18
    m.avancer(); // B18 → B19
    m.avancer(); // B19 → B19b
    m.avancer(); // B19b surbookée
    expect(m.courant()).toMatchObject({ type: "sortie", code: "SURBOOKEE" });
  });

  it("un prospect non éligible arrive sur O1 avec la règle et l'orientation", () => {
    const m = creerMachine(arbre, { projet: "solaire", prefill: { facture_mensuelle: "<60" } });
    repondreJusqua(m, [["B0", "maison"], ["B1", "proprietaire"], ["B2", "non"], ["B3", "solaire"], ["B6", "principale"], ["B7", "100-135"], ["B9", ">2010"], ["B10", "renovee"], ["B12", "tuile"]]);
    m.repondre({ adresse: "1 place Bellecour", cp: "69002", ville: "Lyon" });
    m.repondre({ prenom: "Test", nom: "Demo" });
    m.repondre({ email: "test@example.org", telephone: "0600000003", ne_pas_appeler: "true" });
    m.repondre("4821");
    m.avancer(); // B17b
    m.avancer(); // B18 → O1
    expect(m.courant()).toMatchObject({ type: "sortie", code: "O1" });
    expect(m.etat().nonEligible).toEqual(["facture_faible"]);
  });
});

describe("retour arrière", () => {
  it("retour() revient au nœud précédent et efface sa réponse", () => {
    const m = creerMachine(arbre);
    repondreJusqua(m, [["B0", "maison"], ["B1", "proprietaire"]]);
    m.retour();
    expect(m.courant()).toMatchObject({ type: "noeud", id: "B1" });
    expect(m.etat().reponses).not.toHaveProperty("B1");
  });
});
