import { TRANCHES_FACTURE, type EntreesSolaire, type Equipement } from "@/engine/solaire";
import {
  depenseChauffageDepuisFacture,
  type EnergieChauffage,
  type EntreesPac,
  type ProfilRevenus,
} from "@/engine/pac";
import { deptDepuisCp } from "@/engine/agenda";

import type { ProjetState } from "./store";

/**
 * Traduction des réponses du simulateur en entrées de moteur.
 *
 * Seul endroit qui connaît les deux vocabulaires : les clés d'état d'un côté,
 * les contrats de `engine/` de l'autre. Renvoie `null` tant qu'il manque une
 * réponse indispensable, ce qui laisse l'écran afficher un squelette plutôt
 * que de calculer sur du vide.
 */
export const TRANCHES_SURFACE = [
  "<70",
  "70-99",
  "100-135",
  "136-175",
  ">175",
] as const;

type TrancheFacture = (typeof TRANCHES_FACTURE)[number];

function estTrancheFacture(valeur: string): valeur is TrancheFacture {
  return (TRANCHES_FACTURE as readonly string[]).includes(valeur);
}

function texte(etat: ProjetState, cle: keyof ProjetState["reponses"]): string | undefined {
  const valeur = etat.reponses[cle];
  return typeof valeur === "string" ? valeur : undefined;
}

function liste(etat: ProjetState, cle: keyof ProjetState["reponses"]): string[] {
  const valeur = etat.reponses[cle];
  return Array.isArray(valeur) ? valeur : [];
}

export function entreesSolaire(etat: ProjetState): EntreesSolaire | null {
  const cp = texte(etat, "cp");
  const occupation = texte(etat, "occupation");
  const surface = texte(etat, "surface_sol");
  const chauffage = texte(etat, "chauffage");
  const facture = texte(etat, "facture_mensuelle");

  if (!cp || !occupation || !surface || !chauffage || !facture) {
    return null;
  }
  if (!estTrancheFacture(facture)) return null;

  return {
    dept: deptDepuisCp(cp),
    occupation: occupation as EntreesSolaire["occupation"],
    personnes: texte(etat, "personnes") as EntreesSolaire["personnes"],
    surface_sol: surface,
    chauffage: chauffage as EntreesSolaire["chauffage"],
    equipements: liste(etat, "equipements") as Equipement[],
    facture_mensuelle: facture,
  };
}

/** MaPrimeRénov' : logement de plus de 15 ans. */
function logementPlus15Ans(annee: string | undefined): boolean {
  return annee === "<1997" || annee === "1997-2010";
}

/** CEE Coup de pouce (D43) : tout sauf un logement encore en construction. */
function logementPlus2Ans(annee: string | undefined): boolean {
  return annee !== "en_construction";
}

/** L'énergie de chauffage vient de A5b si posée, sinon se déduit de A5. */
function energieChauffage(etat: ProjetState): EnergieChauffage {
  const explicite = texte(etat, "energie_chauffage");
  if (explicite === "gaz" || explicite === "fioul" || explicite === "bois") {
    return explicite;
  }
  return texte(etat, "chauffage") === "gaz_fioul_bois" ? "gaz" : "elec";
}

export function entreesPac(etat: ProjetState): EntreesPac | null {
  const cp = texte(etat, "cp");
  const surface = texte(etat, "surface_sol");
  const facture = texte(etat, "facture_mensuelle");
  const revenus = texte(etat, "revenus");

  if (!cp || !surface || !facture || !revenus) return null;

  const energie = energieChauffage(etat);
  if (!estTrancheFacture(facture)) return null;
  const index = TRANCHES_FACTURE.indexOf(facture);

  return {
    energie,
    depenseChauffageAn: depenseChauffageDepuisFacture(
      index,
      energie === "elec" ? "radiateurs_electriques" : "gaz_fioul_bois",
    ),
    surfaceTranche: surface,
    dept: deptDepuisCp(cp),
    profil: revenus as ProfilRevenus,
    logementPlus15Ans: logementPlus15Ans(texte(etat, "annee_construction")),
    logementPlus2Ans: logementPlus2Ans(texte(etat, "annee_construction")),
  };
}
