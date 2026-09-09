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
 * Écrans de sortie et d'orientation — jamais d'impasse : chacun porte une
 * offre HomeServe réelle et une façon d'être recontacté. Le bouton d'appel a
 * sa place ici (D34) : on est sorti du parcours.
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

  if (code === "R1") return <EcranRappel sortie={sortie} />;

  const { sorties: t } = contenu.rdv;
  // D38a : sur S5, le rappel passe devant l'offre.
  const rappelEnPrimaire = sortie.cta_principal === "etre_rappele";

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

      {rappelEnPrimaire ? (
        <Link
          href={avecDrapeaux("/sortie/R1", parametres)}
          onClick={() => track("callback_requested", { source: `sortie_${code}` })}
          className={CTA_PRIMAIRE}
        >
          {contenu.rdv.rappel.cta}
        </Link>
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
                className={`flex min-h-14 items-center justify-center rounded-full text-lg font-extrabold ${
                  rappelEnPrimaire
                    ? "border-2 border-neutre-700 bg-white text-neutre-700"
                    : "bg-corail-600 text-white"
                }`}
              >
                {t.decouvrir}
              </a>
            ) : null}
          </div>
        </section>
      ))}

      {!rappelEnPrimaire ? (
        <Link
          href={avecDrapeaux("/sortie/R1", parametres)}
          onClick={() => track("callback_requested", { source: `sortie_${code}` })}
          className="flex min-h-14 items-center justify-center rounded-full border-2 border-neutre-700 bg-white text-lg font-extrabold text-neutre-700"
        >
          {contenu.rdv.rappel.cta}
        </Link>
      ) : null}

      <BoutonAppel source={`sortie_${code}`} step={`/sortie/${code}`} avecMention />
    </main>
  );
}

/** R1 — « être rappelé » : créneau préféré et consentement horodaté. */
function EcranRappel({ sortie }: { sortie: Sortie }) {
  const [envoye, setEnvoye] = useState<string | null>(null);
  const [creneau, setCreneau] = useState<"matin" | "apres_midi">("matin");
  const [consent, setConsent] = useState(false);
  const [nePasAppeler, setNePasAppeler] = useState(false);
  const { rappel } = contenu.rdv;

  if (envoye) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-5">
        <h1 className="text-2xl font-extrabold text-neutre-700">
          {rappel.titre}
        </h1>
        <p className="text-base text-neutre-500">{rappel.texte}</p>
        <p className="rounded-card bg-vert-100 p-3 text-sm font-bold text-vert-600">
          {rappel.consentement_horodate.replace("{date}", envoye)}
        </p>
        <BoutonAppel source="sortie_R1" step="/sortie/R1" avecMention />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-5">
      <h1 className="text-2xl font-extrabold text-neutre-700">{sortie.titre}</h1>
      <p className="text-base text-neutre-500">{sortie.texte}</p>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[13px] font-semibold text-neutre-500">
          {rappel.creneau.libelle}
        </legend>
        <div className="flex gap-1 self-start rounded-full bg-neutre-100 p-1">
          {(["matin", "apres_midi"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setCreneau(p)}
              aria-pressed={creneau === p}
              className={`min-h-11 rounded-full px-4 text-sm font-bold ${
                creneau === p
                  ? "bg-white font-extrabold text-neutre-700"
                  : "text-neutre-500"
              }`}
            >
              {rappel.creneau.options[p]}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex items-start gap-2 text-sm text-neutre-700">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 size-6 accent-corail-600"
        />
        {sortie.consentement ?? rappel.consentement}
      </label>

      <label className="flex items-start gap-2 text-sm text-neutre-700">
        <input
          type="checkbox"
          checked={nePasAppeler}
          onChange={(e) => setNePasAppeler(e.target.checked)}
          className="mt-0.5 size-6 accent-corail-600"
        />
        {rappel.ne_pas_appeler}
      </label>

      <button
        type="button"
        disabled={!consent}
        onClick={() => {
          const horodatage = new Date().toISOString();
          track("callback_requested", {
            creneau,
            consentement: horodatage,
            ne_pas_appeler: nePasAppeler,
          });
          setEnvoye(new Date().toLocaleString("fr-FR"));
        }}
        className={`${CTA_PRIMAIRE} disabled:opacity-40`}
      >
        {rappel.cta}
      </button>
    </main>
  );
}
