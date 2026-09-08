"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { partiesParis } from "@/engine/agenda";
import { track } from "@/lib/analytics";
import { contenu } from "@/lib/content";
import { avecDrapeaux } from "@/lib/navigation";
import { icsDuRdv, lireRdv, type RdvEnregistre } from "@/lib/rdv";

import { BoutonAppel } from "./BoutonAppel";

function dateLisible(iso: string): string {
  const p = partiesParis(new Date(iso));
  return `${String(p.jour).padStart(2, "0")}/${String(p.mois).padStart(2, "0")}/${p.annee}`;
}

function heure(iso: string): string {
  const p = partiesParis(new Date(iso));
  return `${String(p.heure).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

/**
 * Confirmation : récapitulatif, export ICS réel, ce qu'il faut préparer et
 * le déroulé. Le rendez-vous a été écrit en `localStorage` au moment du choix
 * du créneau — c'est lui qui alimente la détection de doublon.
 */
export function Confirmation() {
  const parametres = useSearchParams();
  const [rdv, setRdv] = useState<RdvEnregistre | null>(null);

  useEffect(() => {
    setRdv(lireRdv());
    track("booking_slot_confirmed", { ecran: "confirmation" });
  }, []);

  const { confirmation } = contenu.rdv;

  if (!rdv) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-5">
        <div className="h-8 w-2/3 animate-pulse rounded bg-neutre-100" />
      </main>
    );
  }

  function telecharger() {
    const ics = icsDuRdv(rdv!, contenu.global.bandeau_prototype);
    const url = URL.createObjectURL(
      new Blob([ics], { type: "text/calendar;charset=utf-8" }),
    );
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = "homeserve-etude-gratuite.ics";
    lien.click();
    URL.revokeObjectURL(url);
    track("booking_ics_downloaded", {});
  }

  const champs: Array<[string, string]> = [
    [confirmation.champs.date, dateLisible(rdv.debutIso)],
    [confirmation.champs.creneau, `${heure(rdv.debutIso)} – ${heure(rdv.finIso)}`],
    [confirmation.champs.agence, `${rdv.agenceNom} — ${rdv.distanceKm} km`],
    [confirmation.champs.type, rdv.typeRdv],
  ];

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 p-5">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-vert-100 text-3xl text-vert-400">
          ✓
        </div>
        <h1 className="text-[27px] font-extrabold text-neutre-700">
          {confirmation.titre}
        </h1>
      </div>

      <section className="rounded-tuile border border-neutre-200 p-4">
        <h2 className="text-base font-extrabold text-neutre-700">
          {confirmation.recap_titre}
        </h2>
        <dl className="mt-2 flex flex-col divide-y divide-neutre-100">
          {champs.map(([libelle, valeur]) => (
            <div key={libelle} className="flex justify-between gap-3 py-2 text-[15px]">
              <dt className="text-neutre-500">{libelle}</dt>
              <dd className="text-right font-bold text-neutre-700">{valeur}</dd>
            </div>
          ))}
        </dl>
      </section>

      <button
        type="button"
        onClick={telecharger}
        className="min-h-14 rounded-full border-2 border-neutre-700 bg-white text-lg font-extrabold text-neutre-700"
      >
        {confirmation.agenda}
      </button>

      <section className="rounded-card bg-neutre-100 p-4">
        <h2 className="text-base font-extrabold text-neutre-700">
          {confirmation.preparer.titre}
        </h2>
        <ul className="mt-2 flex flex-col gap-1.5 text-sm text-neutre-700">
          {confirmation.preparer.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-extrabold text-neutre-700">
          {confirmation.deroule.titre}
        </h2>
        <ol className="flex flex-col gap-2">
          {confirmation.deroule.etapes.map((etape, i) => (
            <li
              key={etape}
              className="flex items-center gap-3 rounded-card border border-neutre-200 p-3"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-corail-100 text-sm font-extrabold text-corail-600">
                {i + 1}
              </span>
              <span className="text-sm text-neutre-700">{etape}</span>
            </li>
          ))}
        </ol>
      </section>

      <Link
        href={avecDrapeaux("/gerer", parametres)}
        className="min-h-11 text-sm font-bold text-canard-500 underline"
      >
        {confirmation.gerer}
      </Link>

      <BoutonAppel source="confirmation" step="/confirmation" avecMention />
    </main>
  );
}
