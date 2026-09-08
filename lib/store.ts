"use client";

import { useSyncExternalStore } from "react";

/**
 * État partagé du parcours (docs/architecture-moteurs-v2.md §1 « État partagé »).
 *
 * Persisté en `sessionStorage` : rien ne part sur le réseau. Le rendu serveur
 * part toujours de `ETAT_VIDE` et l'hydratation depuis le stockage n'a lieu
 * qu'au premier abonnement (donc après le premier rendu), ce qui évite tout
 * décalage d'hydratation.
 */
export const CLE_SESSION = "hs.projet";

export type Variant = "defaut" | "mur";
export type Projet = "solaire" | "pac" | "les_deux";

/**
 * Clés de réponses partagées entre le simulateur (module A) et la machine à
 * états (module B). Ce sont celles attendues par `data/arbre-rdv.json` et la
 * table de pré-remplissage de `docs/cartographie-parcours.md` §6 — pas les
 * identifiants d'écrans A0…A10.
 */
export type CleReponse =
  | "projet"
  | "cp"
  | "dept"
  | "type_logement"
  | "occupation"
  | "personnes"
  | "surface_sol"
  | "chauffage"
  | "energie_chauffage"
  | "equipements"
  | "chauffe_eau"
  | "facture_mensuelle"
  | "revenus"
  | "idf"
  | "annee_construction"
  | "toiture";

export type ValeurReponse = string | string[];

export type Resultats = {
  solaire?: unknown;
  pac?: unknown;
  couplage?: unknown;
};

export type EtatRdv = {
  nonEligible: string[];
  sortie?: string;
  agence?: string;
  creneau?: string;
  typeRdv?: string;
};

export type ProjetState = {
  version: 1;
  variant: Variant;
  debug: boolean;
  /** Drapeau de démonstration (D41) : lu depuis `?demo=1`. */
  demo: boolean;
  projet?: Projet;
  reponses: Partial<Record<CleReponse, ValeurReponse>>;
  resultats?: Resultats;
  rdv?: EtatRdv;
  events: string[];
};

export const ETAT_VIDE: ProjetState = Object.freeze({
  version: 1,
  variant: "defaut",
  debug: false,
  demo: false,
  reponses: {},
  events: [],
}) as ProjetState;

let etat: ProjetState = ETAT_VIDE;
let hydrate = false;
const abonnes = new Set<() => void>();

function notifier() {
  for (const abonne of abonnes) abonne();
}

function persister(prochain: ProjetState) {
  try {
    sessionStorage.setItem(CLE_SESSION, JSON.stringify(prochain));
  } catch {
    // Safari en navigation privée, quota, stockage désactivé : le parcours
    // continue en mémoire, on ne casse rien pour de la persistance de confort.
  }
}

function appliquer(prochain: ProjetState) {
  etat = prochain;
  persister(etat);
  notifier();
}

/** Relit le stockage. Appelé au premier abonnement, donc après le premier rendu. */
function hydrater() {
  if (hydrate) return;
  hydrate = true;

  try {
    const brut = sessionStorage.getItem(CLE_SESSION);
    if (brut) {
      const lu = JSON.parse(brut) as Partial<ProjetState>;
      // Un état d'une version antérieure est ignoré plutôt que deviné.
      if (lu.version === 1) {
        etat = {
          ...ETAT_VIDE,
          ...lu,
          reponses: { ...(lu.reponses ?? {}) },
          events: [...(lu.events ?? [])],
        };
      }
    }
  } catch {
    // JSON corrompu ou stockage inaccessible : on repart de l'état vide.
  }

  notifier();
}

function subscribe(abonne: () => void) {
  abonnes.add(abonne);
  hydrater();
  return () => {
    abonnes.delete(abonne);
  };
}

/** `useSyncExternalStore` exige une référence stable entre deux mutations. */
function getSnapshot(): ProjetState {
  return etat;
}

function getServerSnapshot(): ProjetState {
  return ETAT_VIDE;
}

function getSnapshotHydrate(): boolean {
  return hydrate;
}

function getServerSnapshotHydrate(): boolean {
  return false;
}

// ---------------------------------------------------------------- lecture

export function lireEtat(): ProjetState {
  return etat;
}

export function useProjet(): ProjetState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** `false` tant que le stockage n'a pas été relu : permet d'afficher un squelette. */
export function useHydrate(): boolean {
  return useSyncExternalStore(
    subscribe,
    getSnapshotHydrate,
    getServerSnapshotHydrate,
  );
}

// ---------------------------------------------------------------- actions

export function setReponse(cle: CleReponse, valeur: ValeurReponse) {
  const reponses = { ...etat.reponses, [cle]: valeur };
  const projet = cle === "projet" ? (valeur as Projet) : etat.projet;

  appliquer({ ...etat, reponses, projet });
}

export function setResultats(resultats: Resultats) {
  appliquer({ ...etat, resultats: { ...etat.resultats, ...resultats } });
}

export function setVariant(variant: Variant) {
  if (etat.variant === variant) return;
  appliquer({ ...etat, variant });
}

/** Nécessaire pour refléter `?debug=1`, lu côté client uniquement. */
export function setDebug(debug: boolean) {
  if (etat.debug === debug) return;
  appliquer({ ...etat, debug });
}

/** Drapeau `?demo=1` : ouvre les affichages de rentabilité (D41). */
export function setDemo(demo: boolean) {
  if (etat.demo === demo) return;
  appliquer({ ...etat, demo });
}

export function reset() {
  hydrate = true;
  try {
    sessionStorage.removeItem(CLE_SESSION);
  } catch {
    // idem : l'absence de stockage ne doit pas interrompre le parcours.
  }
  etat = ETAT_VIDE;
  notifier();
}

/** Remet le module à zéro entre deux tests (état, abonnés, drapeau d'hydratation). */
export function __reinitialiserPourTests() {
  etat = ETAT_VIDE;
  hydrate = false;
  abonnes.clear();
}
