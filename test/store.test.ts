import { beforeEach, describe, expect, it } from "vitest";

import {
  CLE_SESSION,
  ETAT_VIDE,
  __reinitialiserPourTests,
  lireEtat,
  reset,
  setDebug,
  setReponse,
  setResultats,
  setVariant,
} from "@/lib/store";

beforeEach(() => {
  sessionStorage.clear();
  __reinitialiserPourTests();
});

function lireStockage() {
  const brut = sessionStorage.getItem(CLE_SESSION);
  return brut ? JSON.parse(brut) : null;
}

describe("état vide", () => {
  it("est le point de départ, y compris pour le snapshot serveur", () => {
    expect(ETAT_VIDE.variant).toBe("defaut");
    expect(ETAT_VIDE.debug).toBe(false);
    expect(ETAT_VIDE.reponses).toEqual({});
    expect(ETAT_VIDE.events).toEqual([]);
    expect(ETAT_VIDE.projet).toBeUndefined();
  });

  it("ne contient aucune donnée personnelle par construction", () => {
    expect(JSON.stringify(ETAT_VIDE)).not.toMatch(/@|\+33|nom|email/i);
  });
});

describe("persistance en sessionStorage", () => {
  it("écrit chaque réponse sous la clé hs.projet", () => {
    setReponse("cp", "69001");

    expect(lireStockage()).toMatchObject({
      version: 1,
      reponses: { cp: "69001" },
    });
  });

  it("accepte les réponses multiples (multi-sélection)", () => {
    setReponse("equipements", ["ve", "clim"]);

    expect(lireEtat().reponses.equipements).toEqual(["ve", "clim"]);
    expect(lireStockage().reponses.equipements).toEqual(["ve", "clim"]);
  });

  it("recopie la réponse « projet » dans le champ dédié", () => {
    setReponse("projet", "les_deux");

    expect(lireEtat().projet).toBe("les_deux");
  });

  it("fusionne les résultats au lieu de les remplacer", () => {
    setResultats({ solaire: { economiesAn: 424 } });
    setResultats({ pac: { economiesAn: 300 } });

    expect(lireEtat().resultats).toEqual({
      solaire: { economiesAn: 424 },
      pac: { economiesAn: 300 },
    });
  });

  it("persiste variant et debug", () => {
    setVariant("mur");
    setDebug(true);

    expect(lireStockage()).toMatchObject({ variant: "mur", debug: true });
  });
});

describe("relecture du stockage", () => {
  it("repart de l'état vide quand le JSON est corrompu", () => {
    sessionStorage.setItem(CLE_SESSION, "{ pas du json");
    __reinitialiserPourTests();

    setReponse("cp", "31000");

    expect(lireEtat().reponses).toEqual({ cp: "31000" });
  });

  it("ignore un état d'une version antérieure", () => {
    sessionStorage.setItem(
      CLE_SESSION,
      JSON.stringify({ version: 0, reponses: { cp: "13001" } }),
    );
    __reinitialiserPourTests();

    // Rien n'est hérité : la lecture se fait au premier abonnement, et l'état
    // reste vide tant qu'aucune version 1 n'a été trouvée.
    expect(lireEtat().reponses).toEqual({});
  });
});

describe("reset", () => {
  it("vide l'état et le stockage", () => {
    setReponse("cp", "69001");
    setVariant("mur");

    reset();

    expect(lireEtat()).toEqual(ETAT_VIDE);
    expect(sessionStorage.getItem(CLE_SESSION)).toBeNull();
  });
});
