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

describe("amiante conditionnée à l'année de construction (D50)", () => {
  it("saute B11 quand la maison est postérieure à 1997", () => {
    const m = creerMachine(arbre, { projet: "solaire" });
    repondreJusqua(m, [["B0", "maison"], ["B1", "proprietaire"], ["B2", "non"], ["B3", "solaire"], ["B5", "101-135"], ["B6", "principale"], ["B7", "100-135"], ["B9", ">1997"], ["B10", "origine"]]);
    expect(m.courant()).toMatchObject({ type: "noeud", id: "B12" });
  });

  it("pose B11 quand la maison est antérieure à 1997", () => {
    const m = creerMachine(arbre, { projet: "solaire" });
    repondreJusqua(m, [["B0", "maison"], ["B1", "proprietaire"], ["B2", "non"], ["B3", "solaire"], ["B5", "101-135"], ["B6", "principale"], ["B7", "100-135"], ["B9", "<1997"], ["B10", "origine"]]);
    expect(m.courant()).toMatchObject({ type: "noeud", id: "B11" });
  });

  it("saute aussi B11 sur « je ne sais pas » après 1997", () => {
    const m = creerMachine(arbre, { projet: "solaire" });
    repondreJusqua(m, [["B0", "maison"], ["B1", "proprietaire"], ["B2", "non"], ["B3", "solaire"], ["B5", "101-135"], ["B6", "principale"], ["B7", "100-135"], ["B9", ">1997"], ["B10", "nsp"]]);
    expect(m.courant()).toMatchObject({ type: "noeud", id: "B12" });
  });
});

describe("tranches d'année selon le projet (D49)", () => {
  it("n'offre que trois tranches en solaire seul", () => {
    const m = creerMachine(arbre, { projet: "solaire" });
    repondreJusqua(m, [["B0", "maison"], ["B1", "proprietaire"], ["B2", "non"], ["B3", "solaire"], ["B5", "101-135"], ["B6", "principale"], ["B7", "100-135"]]);
    const c = m.courant();
    if (c.type !== "noeud") throw new Error("attendu un nœud");
    expect(m.optionsDe(c.noeud).map((o) => o.valeur)).toEqual(["<1997", ">1997", "en_construction"]);
  });

  it("garde les quatre tranches dès qu'une pompe à chaleur est en jeu", () => {
    const m = creerMachine(arbre, { projet: "les_deux" });
    repondreJusqua(m, [["B0", "maison"], ["B1", "proprietaire"], ["B2", "non"], ["B3", "les_deux"], ["B5", "101-135"], ["B6", "principale"], ["B7", "100-135"]]);
    const c = m.courant();
    if (c.type !== "noeud") throw new Error("attendu un nœud");
    expect(m.optionsDe(c.noeud)).toHaveLength(4);
  });
});

describe("contact et décideurs (D51, D52)", () => {
  it("B16 ne demande que l'email et le téléphone, sans aucune case", () => {
    const champs = arbre.noeuds.B16.champs as Array<{ id: string; type?: string }>;

    expect(champs.map((c) => c.id)).toEqual(["email", "telephone"]);
    expect(champs.some((c) => c.type === "checkbox")).toBe(false);
  });

  it("la mention sous le CTA porte le lien vers les données personnelles", () => {
    const mention = arbre.noeuds.B16.mention_cta;

    expect(mention.texte).toContain("vous demandez à être contacté par HomeServe");
    expect(mention.lien.libelle).toBe("Données personnelles");
    expect(mention.lien.url).toContain("homeserve.fr");
  });

  it("B19 et B21 exigent la présence des décideurs, sans case à cocher", () => {
    expect(arbre.noeuds.B19.texte).toContain("décideurs du foyer");
    expect(arbre.noeuds.B21.texte).toContain("décideurs du foyer");
    expect(arbre.noeuds.B20).not.toHaveProperty("confirmation_decideurs");
  });
});

describe("garde géographique (B14)", () => {
  function jusquaAdresse(projet: "solaire" = "solaire") {
    const m = creerMachine(arbre, { projet });
    repondreJusqua(m, [["B0", "maison"], ["B1", "proprietaire"], ["B2", "non"], ["B3", projet], ["B5", "101-135"], ["B6", "principale"], ["B7", "100-135"], ["B9", ">1997"], ["B10", "renovee"], ["B12", "tuile"]]);
    expect(m.courant()).toMatchObject({ type: "noeud", id: "B14" });
    return m;
  }
  it("Paris (75) → écran hors zone, la réservation reste possible (D57)", () => {
    const m = jusquaAdresse();
    m.repondre({ adresse: "1 rue de Test", cp: "75001", ville: "Paris" });
    expect(m.courant()).toMatchObject({ type: "noeud", id: "B14z" });

    m.repondre("reserver");
    expect(m.courant()).toMatchObject({ type: "noeud", id: "B15" });
    expect(m.etat().notesTechnicien).toContain("déplacement à confirmer");
  });

  it("hors zone, « être rappelé » mène toujours à R1", () => {
    const m = jusquaAdresse();
    m.repondre({ adresse: "1 rue de Test", cp: "75001", ville: "Paris" });
    m.repondre("rappel");
    expect(m.courant()).toMatchObject({ type: "sortie", code: "R1" });
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
    repondreJusqua(m, [["B0", "maison"], ["B1", "proprietaire"], ["B2", "non"], ["B3", "solaire"], ["B5", "101-135"], ["B6", "principale"], ["B7", "100-135"], ["B9", ">1997"], ["B10", "renovee"], ["B12", "tuile"]]);
    m.repondre({ adresse: "1 place Bellecour", cp, ville: "Lyon" });
    m.repondre({ prenom: "Test", nom: "Demo" });
    return m;
  }

  it("un RDV existant avec le même téléphone → DOUBLON", () => {
    const m = jusquaOtp("69002", [{ telephone: "0600000009", email: "autre@example.org" }]);
    m.repondre({ email: "test@example.org", telephone: "06 00 00 00 09" });
    m.repondre("4821");
    m.avancer();
    expect(m.courant()).toMatchObject({ type: "sortie", code: "DOUBLON" });
  });

  it("le téléphone de test 0600000001 → écran B17c puis poursuite vers l'éligibilité", () => {
    const m = jusquaOtp();
    m.repondre({ email: "test@example.org", telephone: "0600000001" });
    m.repondre("4821");
    m.avancer();
    expect(m.courant()).toMatchObject({ type: "noeud", id: "B17c" });
    m.avancer();
    m.avancer(); // B18 éligible → B19
    expect(m.courant()).toMatchObject({ type: "noeud", id: "B19" });
  });

  it("le CP de test 99999 → écran forte demande, le calendrier reste ouvert", () => {
    const m = jusquaOtp("99999");
    m.repondre({ email: "test@example.org", telephone: "0600000002" });
    m.repondre("4821");
    m.avancer(); // B17b → B18
    m.avancer(); // B18 → B19
    m.avancer(); // B19 → B19b
    m.avancer(); // B19b surbookée → B19c
    expect(m.courant()).toMatchObject({ type: "noeud", id: "B19c" });

    m.repondre("creneaux");
    expect(m.courant()).toMatchObject({ type: "noeud", id: "B20" });
  });

  it("agence saturée, « être rappelé » mène à R1", () => {
    const m = jusquaOtp("99999");
    m.repondre({ email: "test@example.org", telephone: "0600000002" });
    m.repondre("4821");
    m.avancer();
    m.avancer();
    m.avancer();
    m.avancer();
    m.repondre("rappel");
    expect(m.courant()).toMatchObject({ type: "sortie", code: "R1" });
  });
});

describe("orientations avec choix (D57)", () => {
  /**
   * Un parcours complet jusqu'à l'éligibilité, la réponse `declencheur`
   * remplaçant celle du nœud visé. Chaque règle doit produire l'écran
   * intermédiaire B18o, jamais une exclusion.
   */
  function jusquaEligibilite(
    declencheur: Partial<Record<"B5" | "B6" | "B7" | "B9", string>>,
    projet: "solaire" | "pac" = "solaire",
  ) {
    const m = creerMachine(arbre, { projet });
    repondreJusqua(m, [
      ["B0", "maison"],
      ["B1", "proprietaire"],
      ["B2", "non"],
      ["B3", projet],
      ["B5", declencheur.B5 ?? "101-135"],
      ["B6", declencheur.B6 ?? "principale"],
      ["B7", declencheur.B7 ?? "100-135"],
      ["B9", declencheur.B9 ?? (projet === "solaire" ? ">1997" : ">2010")],
    ]);

    // Les nœuds de toiture ne sont pas posés à tous les projets : on répond
    // à ceux qui se présentent, par leur première option, jusqu'à l'adresse.
    const SUITE: Record<string, string> = {
      B10: "renovee",
      B11: "non",
      B12: "tuile",
      B10p: "radiateurs_eau",
      B11p: "oui",
    };
    for (let pas = 0; pas < 6; pas++) {
      const courant = m.courant();
      if (courant.type !== "noeud" || !SUITE[courant.id]) break;
      m.repondre(SUITE[courant.id]!);
    }

    m.repondre({ adresse: "1 place Bellecour", cp: "69002", ville: "Lyon" });
    m.repondre({ prenom: "Test", nom: "Demo" });
    m.repondre({ email: "test@example.org", telephone: "0600000003" });
    m.repondre("4821");
    m.avancer(); // B17b → B18
    m.avancer(); // B18 → B18o ou B19
    return m;
  }

  const CAS = [
    ["facture_faible", { B5: "<60" }],
    ["surface_faible", { B7: "<70" }],
    ["residence_secondaire", { B6: "secondaire" }],
  ] as const;

  for (const [regle, declencheur] of CAS) {
    it(`${regle} : écran d'orientation, puis B19 avec la note technicien`, () => {
      const m = jusquaEligibilite({ ...declencheur });

      expect(m.courant()).toMatchObject({ type: "noeud", id: "B18o" });
      expect(m.etat().nonEligible).toContain(regle);

      m.repondre("reserver");
      expect(m.courant()).toMatchObject({ type: "noeud", id: "B19" });
      expect(m.etat().notesTechnicien).toContain(`regle:${regle}`);
    });
  }

  it("« être rappelé » depuis l'orientation mène à R1", () => {
    const m = jusquaEligibilite({ B5: "<60" });
    m.repondre("rappel");
    expect(m.courant()).toMatchObject({ type: "sortie", code: "R1" });
  });

  it("l'orientation PAC n'est proposée qu'au projet solaire seul", () => {
    const solaire = jusquaEligibilite({ B5: "<60" }, "solaire");
    const noeudSolaire = solaire.courant();
    if (noeudSolaire.type !== "noeud") throw new Error("attendu : un nœud");
    expect(
      solaire.optionsDe(noeudSolaire.noeud).map((o) => o.valeur),
    ).toContain("pac");

    const pac = jusquaEligibilite({ B5: "<60" }, "pac");
    const noeudPac = pac.courant();
    if (noeudPac.type !== "noeud") throw new Error("attendu : un nœud");
    expect(pac.optionsDe(noeudPac.noeud).map((o) => o.valeur)).not.toContain(
      "pac",
    );
  });

  it("un prospect sans règle déclenchée ne voit pas l'écran d'orientation", () => {
    const m = jusquaEligibilite({});
    expect(m.courant()).toMatchObject({ type: "noeud", id: "B19" });
    expect(m.etat().nonEligible).toEqual([]);
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
