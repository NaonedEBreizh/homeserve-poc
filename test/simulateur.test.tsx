import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Simulateur } from "@/components/Simulateur";
import { evenements, viderBus } from "@/lib/analytics";
import { contenu } from "@/lib/content";
import { __reinitialiserPourTests, lireEtat, setReponse } from "@/lib/store";

const pousse = vi.fn();
const parametres = { valeur: new URLSearchParams() };

vi.mock("next/navigation", () => ({
  useSearchParams: () => parametres.valeur,
  usePathname: () => "/simulateur",
  useRouter: () => ({ push: pousse }),
}));

beforeEach(() => {
  sessionStorage.clear();
  __reinitialiserPourTests();
  viderBus();
  pousse.mockClear();
  parametres.valeur = new URLSearchParams();
});

const q = contenu.simulateur.questions;

describe("Simulateur", () => {
  it("émet sim_start avec le projet et la source", () => {
    parametres.valeur = new URLSearchParams("source=page_solaire");
    setReponse("projet", "solaire");
    render(<Simulateur />);

    expect(evenements()[0]).toMatchObject({
      event: "sim_start",
      projet: "solaire",
      source: "page_solaire",
    });
  });

  it("commence par A0 sans projet connu", () => {
    render(<Simulateur />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(q.A0.titre);
  });

  it("saute A0 quand ?projet= l'a déjà répondue", () => {
    setReponse("projet", "solaire");
    render(<Simulateur />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(q.A1.titre);
  });

  it("enregistre un choix et avance immédiatement", () => {
    render(<Simulateur />);
    fireEvent.click(screen.getByRole("button", { name: q.A0.options.solaire }));

    expect(lireEtat().reponses.projet).toBe("solaire");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(q.A1.titre);
  });

  it("n'accepte le code postal qu'à cinq chiffres", () => {
    setReponse("projet", "solaire");
    render(<Simulateur />);

    const champ = screen.getByLabelText(q.A1.titre);
    const valider = screen.getByRole("button", { name: contenu.global.continuer });

    fireEvent.change(champ, { target: { value: "690" } });
    expect(valider).toHaveProperty("disabled", true);

    fireEvent.change(champ, { target: { value: "69002" } });
    expect(valider).toHaveProperty("disabled", false);

    fireEvent.click(valider);
    expect(lireEtat().reponses.cp).toBe("69002");
  });

  it("compte les questions du parcours solaire sans A9 ni A10", () => {
    setReponse("projet", "solaire");
    render(<Simulateur />);

    // A0…A8 sans A5b : 9 questions.
    expect(screen.getByText("2 / 9")).toBeDefined();
  });

  it("ajoute A9 et A10 dès que le projet comporte une pompe à chaleur", () => {
    setReponse("projet", "les_deux");
    render(<Simulateur />);

    // A5b reste conditionnée à un chauffage gaz/fioul/bois, non répondu ici.
    expect(screen.getByText("2 / 11")).toBeDefined();
  });

  it("expose la phrase d'introduction de A9 (D35)", () => {
    setReponse("projet", "pac");
    for (const [cle, valeur] of [
      ["cp", "69002"],
      ["occupation", "5_jours_et_plus"],
      ["personnes", "3-4"],
      ["surface_sol", "100-135"],
      ["chauffage", "radiateurs_electriques"],
      ["equipements", ["aucun"]],
      ["chauffe_eau", "thermodynamique"],
      ["facture_mensuelle", "101-135"],
    ] as const) {
      setReponse(cle as never, valeur as never);
    }
    render(<Simulateur />);

    // On avance jusqu'à A9 en répondant les écrans restants.
    expect(q.A9.intro).toContain("MaPrimeRénov'");
  });

  it("propose le chauffage d'appoint dans A6 (aligné sur hypotheses.json)", () => {
    expect(q.A6.options).toHaveProperty("chauffage_secondaire");
  });

  it("multi-sélection : « aucun » est exclusif", () => {
    setReponse("projet", "solaire");
    render(<Simulateur />);

    // On pilote l'assistant par l'interface jusqu'à A6.
    fireEvent.change(screen.getByLabelText(q.A1.titre), {
      target: { value: "69002" },
    });
    fireEvent.click(screen.getByRole("button", { name: contenu.global.continuer }));
    fireEvent.click(screen.getByRole("button", { name: q.A2.options["5_jours_et_plus"] }));
    fireEvent.click(screen.getByRole("button", { name: q.A3.options["3-4"] }));
    fireEvent.click(screen.getByRole("button", { name: contenu.global.continuer }));
    fireEvent.click(screen.getByRole("button", { name: q.A5.options.radiateurs_electriques }));

    fireEvent.click(screen.getByRole("button", { name: q.A6.options.vehicule_electrique }));
    fireEvent.click(screen.getByRole("button", { name: q.A6.options.aucun }));
    fireEvent.click(screen.getByRole("button", { name: contenu.global.continuer }));

    expect(lireEtat().reponses.equipements).toEqual(["aucun"]);
  });
});
