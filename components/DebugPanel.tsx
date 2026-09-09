"use client";

import { useState } from "react";

import { useEvenements, viderBus, type EvenementSuivi } from "@/lib/analytics";
import { contenu } from "@/lib/content";
import { useProjet } from "@/lib/store";

/**
 * Panneau de débogage, activé par `?debug=1`.
 *
 * Il montre exactement ce qui serait poussé vers la mesure d'audience —
 * nom d'événement, variante, horodatage, charge utile — sans qu'aucune
 * requête ne parte. C'est l'outil qui permet de démontrer l'instrumentation
 * pendant la présentation.
 */
export function DebugPanel() {
  const [ouvert, setOuvert] = useState(false);
  const evenements = useEvenements();
  const { variant } = useProjet();
  const t = contenu.debug;

  return (
    <aside className="border-b border-neutre-200 bg-neutre-100 px-5 py-2 text-xs text-neutre-700">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={() => setOuvert((o) => !o)}
          aria-expanded={ouvert}
          className="flex min-h-11 items-center gap-2 font-extrabold text-canard-700"
        >
          <span aria-hidden="true">{ouvert ? "▾" : "▸"}</span>
          {t.titre} ({evenements.length})
        </button>

        <span className="text-neutre-500">
          {t.variant} : <strong className="text-neutre-700">{variant}</strong>
        </span>

        {evenements.length > 0 ? (
          <button
            type="button"
            onClick={viderBus}
            className="ml-auto min-h-11 font-bold text-canard-700 underline"
          >
            {t.vider}
          </button>
        ) : null}
      </div>

      {ouvert ? (
        <div className="mt-2 flex flex-col gap-2">
          <p className="text-neutre-500">{t.aide}</p>

          {evenements.length === 0 ? (
            <p className="text-neutre-500">{t.vide}</p>
          ) : (
            <ol className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
              {evenements
                .slice()
                .reverse()
                .map((evenement, index) => (
                  <LigneEvenement
                    key={`${evenement.ts}-${index}`}
                    evenement={evenement}
                  />
                ))}
            </ol>
          )}
        </div>
      ) : null}
    </aside>
  );
}

function LigneEvenement({ evenement }: { evenement: EvenementSuivi }) {
  const { event, variant, ts, ...payload } = evenement;
  const cles = Object.keys(payload);

  return (
    <li className="rounded border border-neutre-200 bg-white p-2">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-mono font-extrabold text-corail-600">{event}</span>
        <span className="text-neutre-500">
          {new Date(ts).toLocaleTimeString("fr-FR")} · {variant}
        </span>
      </div>

      {cles.length === 0 ? (
        <p className="text-neutre-500">{contenu.debug.sans_payload}</p>
      ) : (
        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-2">
          {cles.map((cle) => (
            <div key={cle} className="contents">
              <dt className="font-mono text-neutre-500">{cle}</dt>
              <dd className="break-all font-mono text-neutre-700">
                {JSON.stringify(payload[cle])}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </li>
  );
}
