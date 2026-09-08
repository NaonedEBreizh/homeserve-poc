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

describe("Accueil", () => {
  it("annonce les trois promesses et les deux portes d'entrée", () => {
    rendre();

    expect(
      screen.getByRole("heading", { level: 1, name: contenu.accueil.titre }),
    ).toBeDefined();
    expect(
      screen.getByRole("link", { name: new RegExp(contenu.accueil.porte_simulateur.titre) }),
    ).toBeDefined();
    expect(
      screen.getByRole("link", { name: new RegExp(contenu.accueil.porte_rdv.titre) }),
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

  it("propage la variante et le drapeau démo dans les liens", () => {
    rendre("variant=mur&demo=1");

    const lien = screen.getByRole("link", {
      name: new RegExp(contenu.accueil.porte_simulateur.titre),
    });
    expect(lien.getAttribute("href")).toContain("variant=mur");
    expect(lien.getAttribute("href")).toContain("demo=1");
  });
});
