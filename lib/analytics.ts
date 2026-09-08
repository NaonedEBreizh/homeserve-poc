"use client";

import { useSyncExternalStore } from "react";

import { lireEtat, type Variant } from "./store";

/**
 * Mesure agnostique : `track()` pousse dans `window.dataLayer` (GTM / Piwik PRO
 * lisent la même file) et dans un bus interne que le panneau debug affiche.
 * Aucune requête réseau — la liste des événements attendus est dans CLAUDE.md.
 *
 * Mapping cible : `event` → nom d'événement GTM ; `variant` → dimension
 * personnalisée A/B ; les autres clés → paramètres de l'événement.
 */
export type EvenementSuivi = {
  event: string;
  variant: Variant;
  ts: number;
} & Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

const MAX_BUS = 200;

let bus: EvenementSuivi[] = [];
const abonnes = new Set<() => void>();

function notifier() {
  for (const abonne of abonnes) abonne();
}

export function track(
  nom: string,
  payload: Record<string, unknown> = {},
): EvenementSuivi {
  const evenement: EvenementSuivi = {
    event: nom,
    variant: lireEtat().variant,
    ts: Date.now(),
    ...payload,
  };

  if (typeof window !== "undefined") {
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push(evenement);
  }

  // Le bus est borné : une démo longue ne doit pas grossir indéfiniment.
  bus = [...bus, evenement].slice(-MAX_BUS);
  notifier();

  return evenement;
}

function subscribe(abonne: () => void) {
  abonnes.add(abonne);
  return () => {
    abonnes.delete(abonne);
  };
}

function getSnapshot(): EvenementSuivi[] {
  return bus;
}

const BUS_VIDE: EvenementSuivi[] = [];

function getServerSnapshot(): EvenementSuivi[] {
  return BUS_VIDE;
}

export function evenements(): EvenementSuivi[] {
  return bus;
}

export function useEvenements(): EvenementSuivi[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function viderBus() {
  bus = [];
  notifier();
}
