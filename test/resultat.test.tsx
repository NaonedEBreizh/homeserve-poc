import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Resultat } from "@/components/Resultat";
import { evenements, viderBus } from "@/lib/analytics";
import { contenu } from "@/lib/content";
import {
  __reinitialiserPourTests,
  setDemo,
  setReponse,
  setVariant,
} from "@/lib/store";

const parametres = { valeur: new URLSearchParams() };

vi.mock("next/navigation", () => ({
  useSearchParams: () => parametres.valeur,
  usePathname: () => "/resultat",
  useRouter: () => ({ push: vi.fn() }),
}));

/** Parcours solaire complet, tel que le simulateur l'aurait rempli. */
function repondreSimulateur() {
  setReponse("projet", "solaire");
  setReponse("cp", "69002");
  setReponse("occupation", "5_jours_et_plus");
  setReponse("personnes", "3-4");
  setReponse("surface_sol", "100-135");
  setReponse("chauffage", "radiateurs_electriques");
  setReponse("equipements", ["vehicule_electrique"]);
  setReponse("chauffe_eau", "thermodynamique");
  setReponse("facture_mensuelle", "101-135");
}

beforeEach(() => {
  sessionStorage.clear();
  __reinitialiserPourTests();
  parametres.valeur = new URLSearchParams();
});

describe("variante par défaut", () => {
  beforeEach(() => {
    repondreSimulateur();
  });

  it("affiche le résultat sans demander la moindre coordonnée", () => {
    const { container } = render(<Resultat />);

    expect(
      screen.getByRole("heading", { level: 1, name: contenu.resultat.titre }),
    ).toBeDefined();
    // Aucun champ de saisie : le chiffre est donné avant toute coordonnée.
    expect(container.querySelectorAll("input, textarea")).toHaveLength(0);
    expect(screen.queryByText(contenu.mur.titre)).toBeNull();
  });

  it("mène au rendez-vous avec le wording D42", () => {
    render(<Resultat />);

    const cta = screen.getByRole("link", {
      name: contenu.resultat.cta_principal,
    });
    expect(cta.getAttribute("href")).toContain("/rendez-vous");
    expect(contenu.resultat.cta_principal).toBe("Je réserve mon étude gratuite");
  });

  it("expose l'encart taux, la tuile héros, les chips et la courbe", () => {
    render(<Resultat />);

    expect(screen.getByText(contenu.resultat.taux.libelle)).toBeDefined();
    expect(screen.getByRole("slider")).toBeDefined();
    expect(
      screen.getByRole("button", { name: `25 ${contenu.resultat.horizons.unite}` }),
    ).toBeDefined();
  });

  /** Cumul affiché par la tuile héros, en euros. */
  function cumulAffiche(): number {
    const hero = screen.getByRole("heading", {
      level: 2,
      name: /Vos économies cumulées/,
    }).parentElement!;
    const texte = hero.textContent ?? "";
    const montant = /([\d\u00a0\u202f ]+)\s*€/.exec(texte)?.[1] ?? "0";
    return Number(montant.replace(/[^\d]/g, ""));
  }

  it("recalcule en direct quand on choisit le stockage virtuel", () => {
    render(<Resultat />);
    const avant = cumulAffiche();

    fireEvent.click(
      screen.getByRole("button", {
        name: contenu.resultat.configurateur.stockage.options.virtuel,
      }),
    );

    expect(cumulAffiche()).toBeGreaterThan(avant);
  });

  it("recalcule en direct quand on active le couplage pompe à chaleur", () => {
    render(<Resultat />);
    const avant = cumulAffiche();

    fireEvent.click(
      screen.getByRole("button", {
        name: contenu.resultat.configurateur.couplage.options.oui,
      }),
    );

    expect(cumulAffiche()).toBeGreaterThan(avant);
  });

  it("recalcule le cumul quand on change l'horizon", () => {
    render(<Resultat />);

    const avant = screen.getByRole("slider").getAttribute("aria-valuemax");
    fireEvent.click(
      screen.getByRole("button", { name: `10 ${contenu.resultat.horizons.unite}` }),
    );
    const apres = screen.getByRole("slider").getAttribute("aria-valuemax");

    expect(avant).toBe("25");
    expect(apres).toBe("10");
  });

  it("ramène le curseur de la courbe dans l'horizon quand il change", () => {
    render(<Resultat />);

    const courbe = () => screen.getByRole("slider");
    expect(courbe().getAttribute("aria-valuenow")).toBe("25");

    fireEvent.click(
      screen.getByRole("button", { name: `10 ${contenu.resultat.horizons.unite}` }),
    );

    // Sans recadrage, l'index resterait à 25 et l'infobulle afficherait 0 €.
    expect(courbe().getAttribute("aria-valuenow")).toBe("10");
    expect(courbe().getAttribute("aria-valuetext")).not.toMatch(/sans 0 €/);
  });

  it("déplace le curseur de lecture au clavier", () => {
    render(<Resultat />);

    const courbe = screen.getByRole("slider");
    expect(courbe.getAttribute("aria-valuenow")).toBe("25");

    fireEvent.keyDown(courbe, { key: "ArrowLeft" });
    expect(courbe.getAttribute("aria-valuenow")).toBe("24");

    fireEvent.keyDown(courbe, { key: "ArrowRight" });
    expect(courbe.getAttribute("aria-valuenow")).toBe("25");
  });

  it("nomme le pack sans jamais dire « votre installation »", () => {
    render(<Resultat />);

    const intro = screen.getByText(contenu.resultat.recommandation.intro);
    const carte = intro.closest("section");

    expect(carte).not.toBeNull();
    // La règle porte sur la carte pack : « votre installation de chauffage »
    // reste légitime ailleurs (section « Et après ? »).
    expect(carte!.textContent).not.toContain("votre installation");
    expect(carte!.textContent).toContain(contenu.resultat.recommandation.intro);
  });
});

describe("section « Et après ? » (D44)", () => {
  beforeEach(() => {
    repondreSimulateur();
  });

  it("place la frise, la carte et les preuves après la carte pack", () => {
    render(<Resultat />);

    const { et_apres } = contenu.resultat;
    const titre = screen.getByRole("heading", { level: 2, name: et_apres.titre });
    const section = titre.closest("section");
    expect(section).not.toBeNull();

    const dans = within(section!);
    for (const etape of et_apres.etapes) {
      expect(dans.getByText(etape.titre)).toBeDefined();
    }
    expect(dans.getByText(et_apres.carte.titre)).toBeDefined();
    for (const item of et_apres.carte.items) {
      expect(dans.getByText(item)).toBeDefined();
    }
    for (const preuve of et_apres.preuves) {
      expect(dans.getByText(preuve)).toBeDefined();
    }
  });

  it("marque la première étape comme faite et les suivantes comme à venir", () => {
    const { et_apres } = contenu.resultat;

    expect(et_apres.etapes[0]!.faite).toBe(true);
    expect(et_apres.etapes.slice(1).every((e) => e.faite === false)).toBe(true);
  });

  it("émet sim_next_steps_viewed une seule fois", () => {
    viderBus();
    render(<Resultat />);

    const vues = evenements().filter((e) => e.event === "sim_next_steps_viewed");
    expect(vues).toHaveLength(1);
  });
});

describe("rentabilité (D41)", () => {
  beforeEach(() => {
    repondreSimulateur();
  });

  it("ne rend pas le trait de rentabilité sans le drapeau", () => {
    render(<Resultat />);

    expect(screen.queryByTestId("trait-rentabilite")).toBeNull();
    expect(
      screen.queryByText(contenu.resultat.rentabilite.mention),
    ).toBeNull();
  });

  it("affiche le trait, la ligne du pack et la mention légale avec ?demo=1", () => {
    setDemo(true);
    render(<Resultat />);

    expect(screen.getByTestId("trait-rentabilite")).toBeDefined();
    expect(screen.getByText(contenu.resultat.rentabilite.mention)).toBeDefined();
  });
});

describe("variante mur", () => {
  it("affiche M1 avant le résultat, sans jamais montrer le chiffre", () => {
    repondreSimulateur();
    setVariant("mur");
    render(<Resultat />);

    expect(screen.getByText(contenu.mur.titre)).toBeDefined();
    expect(screen.getByText(contenu.mur.etiquette)).toBeDefined();
    expect(
      screen.queryByRole("heading", { level: 1, name: contenu.resultat.titre }),
    ).toBeNull();
  });

  it("remercie après envoi, toujours sans résultat", () => {
    repondreSimulateur();
    setVariant("mur");
    render(<Resultat />);

    for (const champ of contenu.mur.champs) {
      fireEvent.change(screen.getByLabelText(champ), {
        target: { value: "test" },
      });
    }
    fireEvent.click(screen.getByRole("button", { name: contenu.mur.cta }));

    expect(screen.getByText(contenu.mur.merci.titre)).toBeDefined();
    expect(screen.queryByText(contenu.resultat.taux.libelle)).toBeNull();
  });
});

describe("panneau « Comprendre mes résultats » (D37)", () => {
  it("ouvre un onglet par bloc, avec vignette et explication", () => {
    repondreSimulateur();
    render(<Resultat />);

    fireEvent.click(
      screen.getByRole("button", { name: contenu.resultat.comprendre }),
    );

    const blocs = contenu.resultat.comprendre_panneau.blocs;
    for (const bloc of Object.values(blocs)) {
      expect(screen.getByRole("button", { name: bloc.titre })).toBeDefined();
    }

    // Le premier onglet est ouvert : son explication est lisible.
    expect(screen.getByText(blocs.taux.texte)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: blocs.stockage.titre }));
    expect(screen.getByText(blocs.stockage.texte)).toBeDefined();
    expect(screen.queryByText(blocs.taux.texte)).toBeNull();
  });
});
