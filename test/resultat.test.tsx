import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Resultat } from "@/components/Resultat";
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
    const { container } = render(<Resultat />);

    expect(screen.getByText(contenu.resultat.recommandation.intro)).toBeDefined();
    expect(container.textContent).not.toContain("votre installation");
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
