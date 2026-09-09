"use client";

import { genererIcs, type Creneau } from "@/engine/agenda";

/**
 * Rendez-vous de démonstration, conservé en `localStorage` pour que la règle
 * de doublon (D32) soit démontrable d'une session à l'autre. Rien ne sort du
 * navigateur.
 */
export const CLE_RDV = "hs.rdv";

export type RdvEnregistre = {
  telephone: string;
  email: string;
  debutIso: string;
  finIso: string;
  agenceId: string;
  agenceNom: string;
  distanceKm: number;
  typeRdv: string;
  /** D51 : consentements recueillis en B16, horodatés. */
  consentementContact?: boolean;
  consentementMarketing?: boolean;
  consentementHorodatage?: string;
};

export function lireRdv(): RdvEnregistre | null {
  try {
    const brut = localStorage.getItem(CLE_RDV);
    return brut ? (JSON.parse(brut) as RdvEnregistre) : null;
  } catch {
    return null;
  }
}

/** Liste attendue par `creerMachine(..., { contexte: { rdvExistants } })`. */
export function lireRdvExistants(): Array<{ telephone: string; email: string }> {
  const rdv = lireRdv();
  return rdv ? [{ telephone: rdv.telephone, email: rdv.email }] : [];
}

export function enregistrerRdv(rdv: RdvEnregistre) {
  try {
    localStorage.setItem(CLE_RDV, JSON.stringify(rdv));
  } catch {
    // Stockage indisponible : la démo continue, seule la détection de
    // doublon d'une session à l'autre est perdue.
  }
}

/** Fichier .ics du rendez-vous, prêt à être téléchargé via un Blob. */
export function icsDuRdv(rdv: RdvEnregistre, description: string): string {
  const debut = new Date(rdv.debutIso);
  const dureeMin = Math.round(
    (new Date(rdv.finIso).getTime() - debut.getTime()) / 60_000,
  );

  return genererIcs({
    debut,
    dureeMin,
    titre: rdv.typeRdv,
    lieu: `${rdv.agenceNom}`,
    description,
    uid: `${debut.getTime()}-${rdv.agenceId}@homeserve-poc`,
  });
}

export function creneauVersRdv(
  creneau: Creneau,
  contact: { telephone: string; email: string },
  agence: { id: string; nom: string },
  distanceKm: number,
  typeRdv: string,
): RdvEnregistre {
  return {
    telephone: contact.telephone,
    email: contact.email,
    debutIso: creneau.debut.toISOString(),
    finIso: creneau.fin.toISOString(),
    agenceId: agence.id,
    agenceNom: agence.nom,
    distanceKm,
    typeRdv,
  };
}
