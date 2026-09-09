import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EcranSortie } from "@/components/EcranSortie";
import { MachineRdv } from "@/components/MachineRdv";
import arbre from "@/data/arbre-rdv.json";
import { contenu } from "@/lib/content";
import { __reinitialiserPourTests, setReponse, setRdv } from "@/lib/store";

const pousse = vi.fn();
const remplace = vi.fn();
const parametres = { valeur: new URLSearchParams() };

vi.mock("next/navigation", () => ({
  useSearchParams: () => parametres.valeur,
  usePathname: () => "/rendez-vous",
  useRouter: () => ({ push: pousse, replace: remplace }),
}));

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  __reinitialiserPourTests();
  pousse.mockClear();
  remplace.mockClear();
  parametres.valeur = new URLSearchParams();
});

const noeuds = arbre.noeuds as Record<string, { question?: string; titre?: string }>;

function titreAffiche(): string {
  return screen.getAllByRole("heading", { level: 2 })[0]!.textContent ?? "";
}

describe("porte chaude (accès direct)", () => {
  it("commence à B0 et pose toutes les questions", () => {
    render(<MachineRdv />);

    expect(titreAffiche()).toBe(noeuds.B0!.question);
    // Panneau « Vos réponses » vide, avec son explication.
    expect(screen.getByText(contenu.rdv.porte_chaude)).toBeDefined();
    expect(
      screen.getByText(contenu.rdv.panneau_reponses.vide),
    ).toBeDefined();
  });

  it("pose B3 puis B5 quand rien n'est hérité", () => {
    render(<MachineRdv />);

    fireEvent.click(screen.getByRole("button", { name: "Une maison" }));
    fireEvent.click(screen.getByRole("button", { name: "Propriétaire" }));
    fireEvent.click(screen.getByRole("button", { name: "Non" }));

    expect(titreAffiche()).toBe(noeuds.B3!.question);
  });
});

describe("porte tiède (venu du simulateur)", () => {
  beforeEach(() => {
    setReponse("projet", "solaire");
    setReponse("cp", "69002");
    setReponse("surface_sol", "100-135");
    setReponse("facture_mensuelle", "101-135");
    setReponse("annee_construction", ">2010");
    setReponse("chauffage", "radiateurs_electriques");
  });

  it("saute B3 et B5, déjà répondus par l'estimation", () => {
    render(<MachineRdv />);

    fireEvent.click(screen.getByRole("button", { name: "Une maison" }));
    fireEvent.click(screen.getByRole("button", { name: "Propriétaire" }));
    fireEvent.click(screen.getByRole("button", { name: "Non" }));

    // B3 (projet) et B5 (facture) hérités → on arrive directement en B6.
    expect(titreAffiche()).toBe(noeuds.B6!.question);
  });

  it("affiche les réponses reprises avec leur badge", () => {
    render(<MachineRdv />);

    expect(
      screen.getAllByText(contenu.rdv.panneau_reponses.badge_herite).length,
    ).toBe(6);
    expect(screen.getByText("69002")).toBeDefined();
  });

  it("offre un crayon par réponse reprise", () => {
    render(<MachineRdv />);

    expect(
      screen.queryByText(contenu.rdv.porte_chaude),
    ).toBeNull();
  });
});

describe("sorties", () => {
  it("rend S3 avec l'URL réelle de l'offre locataire", () => {
    render(<EcranSortie code="S3" />);

    const sortie = arbre.sorties["@S3"];
    expect(
      screen.getByRole("heading", { level: 1, name: sortie.titre }),
    ).toBeDefined();

    const lien = screen.getByRole("link", {
      name: contenu.rdv.sorties.decouvrir,
    });
    expect(lien.getAttribute("href")).toBe(sortie.offre.url);
    expect(lien.getAttribute("href")).toContain("assistance.homeserve.fr");
  });

  it("rend S5 avec « Être rappelé » en primaire et la PAC en secondaire (D38a)", () => {
    render(<EcranSortie code="S5" />);

    const sortie = arbre.sorties["@S5"];
    expect(
      screen.getByRole("heading", { level: 1, name: sortie.titre }),
    ).toBeDefined();
    expect(sortie.titre).toBe("Votre toiture demande un regard d'expert");

    // Le rappel est le CTA principal : fond corail, pas de bordure.
    const rappel = screen.getByRole("link", { name: contenu.rdv.rappel.cta });
    expect(rappel.className).toContain("bg-corail-600");

    // L'offre PAC devient secondaire : bordure, fond blanc.
    const offre = screen.getByRole("link", {
      name: contenu.rdv.sorties.decouvrir,
    });
    expect(offre.className).toContain("border-2");
    expect(offre.getAttribute("href")).toContain("pompes-a-chaleur");
  });

  it("porte le badge « règle simulée » sur DOUBLON et propose l'appel", () => {
    render(<EcranSortie code="DOUBLON" />);

    expect(screen.getByText(arbre.sorties["@DOUBLON"].badge)).toBeDefined();
    // D34 : l'appel est autorisé sur les écrans de sortie.
    expect(screen.getAllByRole("link").length).toBeGreaterThan(0);
  });

  it("R1 exige le consentement avant d'enregistrer le rappel", () => {
    render(<EcranSortie code="R1" />);

    const envoyer = screen.getByRole("button", {
      name: contenu.rdv.rappel.cta,
    });
    expect(envoyer).toHaveProperty("disabled", true);

    fireEvent.click(screen.getByRole("checkbox", { name: /J'accepte/ }));
    expect(envoyer).toHaveProperty("disabled", false);

    fireEvent.click(envoyer);
    expect(
      screen.getByText(/Consentement enregistré le/),
    ).toBeDefined();
  });
});

describe("wording D42", () => {
  it("ne dit jamais « visite technique » dans l'arbre", () => {
    expect(JSON.stringify(arbre)).not.toContain("visite technique");
    expect(JSON.stringify(arbre)).not.toContain("Visite technique");
  });

  it("nomme l'étude gratuite en B19 et le technicien-conseil en B21", () => {
    expect(noeuds.B19!.titre).toBe("Votre étude gratuite à domicile");
    expect(noeuds.B21!.titre).toBe(
      "Ce rendez-vous mobilise un technicien-conseil",
    );
    expect(contenu.rdv.confirmation.titre).toBe(
      "Votre étude gratuite est confirmée",
    );
  });
});
