"use client";

import { useMemo, useState } from "react";

import {
  genererCreneaux,
  partiesParis,
  type Agence,
  type Creneau,
  type Periode,
} from "@/engine/agenda";
import { contenu } from "@/lib/content";
import { remplacer } from "@/lib/format";

const MAX_CHIPS = 6;
const JOURS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

function libelleJour(instant: Date): string {
  const p = partiesParis(instant);
  const jour = new Date(Date.UTC(p.annee, p.mois - 1, p.jour)).getUTCDay();
  return `${JOURS[jour]} ${p.jour} ${MOIS[p.mois - 1]}`;
}

function heure(instant: Date): string {
  const p = partiesParis(instant);
  return `${String(p.heure).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

function cleJour(instant: Date): string {
  const p = partiesParis(instant);
  return `${p.annee}-${p.mois}-${p.jour}`;
}

/**
 * Calendrier de l'agenda simulé (D40) : 14 jours, débuts toutes les 30 min,
 * visites d'une heure, onglets Matin / Après-midi et jusqu'à six créneaux par
 * période. Les jours sans créneau restent visibles mais grisés — un
 * calendrier troué est une information, pas un défaut.
 */
export function Calendrier({
  agence,
  distanceKm,
  cp,
  aujourdhui,
  confirmationDecideurs,
  onConfirmer,
  onAucunCreneau,
}: {
  agence: Agence;
  distanceKm: number;
  cp: string;
  aujourdhui: Date;
  /** D52 : case à cocher exigée avant la confirmation du créneau. */
  confirmationDecideurs?: string;
  onConfirmer: (creneau: Creneau) => void;
  onAucunCreneau: () => void;
}) {
  const { calendrier } = contenu.rdv;

  const creneaux = useMemo(
    () =>
      genererCreneaux(agence, {
        seed: cp,
        aujourdhui,
        horizonJours: agence.horizon_jours,
        delaiMinJoursOuvres: agence.delai_min_jours_ouvres,
        dureeMin: agence.duree_visite_min,
      }),
    [agence, cp, aujourdhui],
  );

  const jours = useMemo(() => {
    const parJour = new Map<string, { date: Date; creneaux: Creneau[] }>();
    for (let i = 1; i <= agence.horizon_jours; i++) {
      const date = new Date(aujourdhui.getTime() + i * 86_400_000);
      parJour.set(cleJour(date), { date, creneaux: [] });
    }
    for (const creneau of creneaux) {
      parJour.get(cleJour(creneau.debut))?.creneaux.push(creneau);
    }
    return [...parJour.values()];
  }, [creneaux, aujourdhui, agence.horizon_jours]);

  const premierPlein = jours.find((j) => j.creneaux.length > 0);
  const [jourActif, setJourActif] = useState(
    premierPlein ? cleJour(premierPlein.date) : null,
  );
  const [periode, setPeriode] = useState<Periode>(
    premierPlein?.creneaux[0]?.periode ?? "matin",
  );
  const [choisi, setChoisi] = useState<Creneau | null>(null);
  const [decideurs, setDecideurs] = useState(false);

  const duJour = jours.find((j) => cleJour(j.date) === jourActif)?.creneaux ?? [];
  const affiches = duJour.filter((c) => c.periode === periode).slice(0, MAX_CHIPS);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-card bg-neutre-100 p-3">
        <span className="text-sm font-bold text-neutre-700">
          {remplacer(calendrier.agence, { nom: agence.nom, km: distanceKm })}
        </span>
        <span className="rounded-full bg-vert-100 px-2 py-0.5 text-[11px] font-extrabold text-vert-600">
          {calendrier.rge}
        </span>
        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-extrabold text-neutre-700">
          {calendrier.badge}
        </span>
      </div>

      <header className="flex flex-col gap-1">
        <h2 className="text-xl font-extrabold text-neutre-700">{calendrier.titre}</h2>
        <p className="text-sm text-neutre-500">{calendrier.sous_titre}</p>
      </header>

      <ul className="grid grid-cols-7 gap-1.5">
        {jours.map((jour) => {
          const cle = cleJour(jour.date);
          const vide = jour.creneaux.length === 0;
          const actif = cle === jourActif;
          const p = partiesParis(jour.date);

          return (
            <li key={cle}>
              <button
                type="button"
                disabled={vide}
                onClick={() => {
                  setJourActif(cle);
                  setChoisi(null);
                  setPeriode(jour.creneaux[0]?.periode ?? "matin");
                }}
                aria-label={
                  vide
                    ? `${libelleJour(jour.date)} — ${calendrier.jour_sans}`
                    : libelleJour(jour.date)
                }
                aria-pressed={actif}
                className={`flex size-11 items-center justify-center rounded-xl text-base font-bold ${
                  vide
                    ? "cursor-not-allowed text-neutre-300"
                    : actif
                      ? "bg-corail-600 text-white"
                      : "border border-neutre-200 text-neutre-700"
                }`}
              >
                {p.jour}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex gap-1 self-start rounded-full bg-neutre-100 p-1">
        {(["matin", "apres_midi"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriode(p)}
            aria-pressed={periode === p}
            className={`min-h-11 rounded-full px-4 text-sm font-bold ${
              periode === p
                ? "bg-white font-extrabold text-neutre-700"
                : "text-neutre-500"
            }`}
          >
            {calendrier.periodes[p]}
          </button>
        ))}
      </div>

      {affiches.length === 0 ? (
        <p className="text-sm text-neutre-500">{calendrier.jour_sans}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {affiches.map((creneau) => {
            const actif = choisi?.debut.getTime() === creneau.debut.getTime();
            return (
              <li key={creneau.debut.toISOString()}>
                <button
                  type="button"
                  onClick={() => setChoisi(creneau)}
                  aria-pressed={actif}
                  className={`min-h-11 rounded-full border px-4 text-sm font-bold ${
                    actif
                      ? "border-corail-600 bg-corail-600 text-white"
                      : "border-neutre-200 text-neutre-700"
                  }`}
                >
                  {heure(creneau.debut)}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={onAucunCreneau}
        className="min-h-11 self-start text-sm font-bold text-canard-500 underline"
      >
        {calendrier.aucun}
      </button>

      {choisi ? (
        <div className="sticky bottom-0 -mx-5 flex flex-col gap-2 border-t border-neutre-200 bg-white px-5 py-3">
          <span className="text-sm font-bold text-neutre-700">
            {remplacer(calendrier.recap, {
              jour: libelleJour(choisi.debut),
              debut: heure(choisi.debut),
              fin: heure(choisi.fin),
            })}
          </span>

          {/* D52 : l'étude n'a de valeur que si les décideurs sont là. */}
          {confirmationDecideurs ? (
            <label className="flex items-start gap-2 text-sm text-neutre-700">
              <input
                type="checkbox"
                checked={decideurs}
                onChange={(e) => setDecideurs(e.target.checked)}
                className="mt-0.5 size-6 shrink-0 accent-corail-600"
              />
              {confirmationDecideurs}
            </label>
          ) : null}

          <button
            type="button"
            disabled={Boolean(confirmationDecideurs) && !decideurs}
            onClick={() => onConfirmer(choisi)}
            className="flex min-h-14 items-center justify-center rounded-full bg-corail-600 px-4 text-base font-extrabold text-white shadow-[0_2px_6px_rgba(226,44,34,0.24)] disabled:opacity-40"
          >
            {calendrier.cta}
          </button>
        </div>
      ) : null}
    </section>
  );
}
