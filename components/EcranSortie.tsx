"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import arbre from "@/data/arbre-rdv.json";
import { track } from "@/lib/analytics";
import { contenu } from "@/lib/content";
import { avecDrapeaux } from "@/lib/navigation";

import { CTA_PRIMAIRE } from "@/lib/styles";

import { BoutonAppel } from "./BoutonAppel";

type Offre = {
  libelle: string;
  url?: string;
  en_ligne?: boolean;
  note?: string;
};

type Sortie = {
  code: string;
  titre: string;
  texte?: string;
  offre?: Offre;
  offre_2?: Offre;
  texte_par_regle?: Record<string, string>;
  orientations?: Record<string, string>;
  cta_principal?: string;
  cta_secondaire?: string;
  cta?: string;
  badge?: string;
  consentement?: string;
};

const SORTIES = arbre.sorties as unknown as Record<string, Sortie>;

/**
 * Écrans de sortie — jamais d'impasse : chacun porte une offre HomeServe
 * réelle. Le bouton d'appel a sa place ici (D34) : on est sorti du parcours.
 * Aucune demande de rappel (D58).
 */
export function EcranSortie({ code }: { code: string }) {
  const parametres = useSearchParams();
  const sortie = SORTIES[`@${code}`];

  if (!sortie) {
    return (
      <main className="mx-auto w-full max-w-md p-5">
        <p className="text-neutre-500">Sortie inconnue : {code}</p>
      </main>
    );
  }

  const { sorties: t } = contenu.rdv;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 p-5">
      {sortie.badge ? (
        <p className="self-start rounded-full bg-orange-100 px-3 py-1 text-xs font-extrabold text-neutre-700">
          {sortie.badge}
        </p>
      ) : null}

      <h1 className="text-[25px] font-extrabold leading-tight text-neutre-700">
        {sortie.titre}
      </h1>

      {sortie.texte ? (
        <p className="text-base text-neutre-500">{sortie.texte}</p>
      ) : null}

      {[sortie.offre, sortie.offre_2].filter(Boolean).map((offre) => (
        <section
          key={offre!.libelle}
          className="overflow-hidden rounded-tuile border border-neutre-200"
        >
          <p className="bg-neutre-100 px-4 py-2 text-sm font-extrabold text-neutre-700">
            {t.offre}
          </p>
          <div className="flex flex-col gap-2 p-4">
            <h2 className="text-lg font-extrabold text-neutre-700">
              {offre!.libelle}
            </h2>
            <p className="text-xs text-neutre-500">
              {offre!.en_ligne ? t.en_ligne : t.par_telephone}
            </p>
            {offre!.url ? (
              <a
                href={offre!.url}
                onClick={() => track("booking_exit_offre", { code })}
                className={CTA_PRIMAIRE}
              >
                {t.decouvrir}
              </a>
            ) : null}
          </div>
        </section>
      ))}

      <BoutonAppel source={`sortie_${code}`} step={`/sortie/${code}`} avecMention />
    </main>
  );
}
