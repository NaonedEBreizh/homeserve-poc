import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Accueil } from "@/components/Accueil";
import { contenu } from "@/lib/content";
import { __reinitialiserPourTests, lireEtat } from "@/lib/store";

const parametres = { valeur: new URLSearchParams() };

vi.mock("next/navigation", () => ({
  useSearchParams: () => parametres.valeur,
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}));

function rendre(query = "") {
  sessionStorage.clear();
  __reinitialiserPourTests();
  parametres.valeur = new URLSearchParams(query);
  return render(<Accueil />);
}

describe("Accueil (D54 : gabarit de page produit)", () => {
  it("présente le produit solaire et les deux portes, avec leurs cibles", () => {
    rendre();

    const { solaire } = contenu.accueil.produit;
    expect(
      screen.getByRole("heading", { level: 1, name: new RegExp(solaire.titre) }),
    ).toBeDefined();
    expect(screen.getByText(solaire.texte)).toBeDefined();
    for (const preuve of solaire.preuves) {
      expect(screen.getByText(preuve)).toBeDefined();
    }
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: contenu.accueil.ou_en_etes_vous,
      }),
    ).toBeDefined();

    const simulateur = screen.getByRole("link", {
      name: new RegExp(contenu.accueil.porte_simulateur.titre),
    });
    const rdv = screen.getByRole("link", {
      name: new RegExp(contenu.accueil.porte_rdv.titre),
    });
    expect(simulateur.getAttribute("href")).toContain("/simulateur");
    expect(rdv.getAttribute("href")).toContain("/rendez-vous");
  });

  it("change de gabarit avec ?projet=pac", () => {
    rendre("projet=pac");

    const { pac, solaire } = contenu.accueil.produit;
    expect(
      screen.getByRole("heading", { level: 1, name: new RegExp(pac.titre) }),
    ).toBeDefined();
    expect(screen.getByText(pac.texte)).toBeDefined();
    // Le texte solaire ne subsiste nulle part sur la page.
    expect(screen.queryByText(solaire.texte)).toBeNull();
    // L'accroche porte le montant d'aides calculé depuis le barème.
    expect(
      screen.getByText((texte) => /Jusqu'à [\d\u00a0\u202f ]+ € d'aides/.test(texte)),
    ).toBeDefined();
  });

  it("ne demande aucune coordonnée", () => {
    const { container } = rendre();

    expect(container.querySelectorAll("input, textarea")).toHaveLength(0);
  });

  it("pré-répond A0 et affiche le contexte avec ?projet=solaire", () => {
    rendre("projet=solaire");

    expect(lireEtat().reponses.projet).toBe("solaire");
    expect(lireEtat().projet).toBe("solaire");
    expect(screen.getByText(/Vous venez de la page Solaire/)).toBeDefined();
  });

  it("ignore un projet inconnu dans l'URL", () => {
    rendre("projet=nimportequoi");

    expect(lireEtat().reponses.projet).toBeUndefined();
  });

  it("propage la variante et le drapeau debug dans les liens", () => {
    rendre("variant=mur&debug=1");

    const lien = screen.getByRole("link", {
      name: new RegExp(contenu.accueil.porte_simulateur.titre),
    });
    expect(lien.getAttribute("href")).toContain("variant=mur");
    expect(lien.getAttribute("href")).toContain("debug=1");
  });
});
