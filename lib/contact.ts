import hypotheses from "@/data/hypotheses.json";

import { partiesParis } from "@/engine/agenda";
import { contenu } from "./content";
import type { Projet } from "./store";

/**
 * Contact téléphonique (D34). Numéros et horaires sont des données
 * (`hypotheses.contact`) : les changer ne touche aucun `.ts`.
 *
 * Hors horaires, l'appel n'a pas de sens — le bouton bascule sur « Être
 * rappelé » et l'écran affiche les horaires.
 */
const CONTACT = hypotheses.contact;

export type Ligne = "solaire" | "renovation";

export type Contact = {
  numero: string;
  numeroTel: string;
  ligne: Ligne;
  ouvert: boolean;
  horaires: string;
  libelle: string;
  mention: string;
};

/** Ligne téléphonique selon le projet ; la table vit dans les données. */
export function lignePourProjet(projet?: Projet): Ligne {
  const table = CONTACT.numero_par_projet as Record<string, string>;
  const ligne = projet ? table[projet] : undefined;
  return ligne === "solaire" ? "solaire" : "renovation";
}

export function numeroDeLigne(ligne: Ligne): string {
  return ligne === "solaire" ? CONTACT.solaire : CONTACT.renovation;
}

/** Jour ISO (1 = lundi) et minutes depuis minuit, en heure de Paris. */
function momentParis(instant: Date): { jourIso: number; minutes: number } {
  const p = partiesParis(instant);
  const jour = new Date(Date.UTC(p.annee, p.mois - 1, p.jour)).getUTCDay();

  return {
    jourIso: jour === 0 ? 7 : jour,
    minutes: p.heure * 60 + p.minute,
  };
}

function enMinutes(heure: string): number {
  const [h, m] = heure.split(":").map(Number);
  return h! * 60 + m!;
}

/** Les conseillers sont-ils joignables à cet instant ? */
export function estOuvert(instant: Date = new Date()): boolean {
  const { jourIso, minutes } = momentParis(instant);

  return CONTACT.horaires.jours.some(
    (plage) =>
      plage.jours_iso.includes(jourIso) &&
      minutes >= enMinutes(plage.debut) &&
      minutes < enMinutes(plage.fin),
  );
}

export function contactPourProjet(
  projet?: Projet,
  instant: Date = new Date(),
): Contact {
  const ligne = lignePourProjet(projet);
  const numero = numeroDeLigne(ligne);
  const ouvert = estOuvert(instant);
  const horaires = CONTACT.horaires.libelle;
  const appel = contenu.global.appel;

  return {
    numero,
    numeroTel: numero.replace(/\s/g, ""),
    ligne,
    ouvert,
    horaires,
    libelle: ouvert ? appel.libelle : appel.libelle_ferme,
    mention: (ouvert ? appel.horaires_mention : appel.ferme_mention).replace(
      "{horaires}",
      horaires,
    ),
  };
}
