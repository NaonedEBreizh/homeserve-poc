"use client";

import { useState } from "react";

import { useEvenements } from "@/lib/analytics";
import { contenu } from "@/lib/content";
import { useProjet } from "@/lib/store";

/**
 * Panneau d'événements, affiché uniquement avec `?debug=1`.
 * Version minimale du bloc 1 : le bloc 7 en fera la version complète.
 */
export function DebugPanel() {
  const [ouvert, setOuvert] = useState(false);
  const evenements = useEvenements();
  const { variant } = useProjet();
  const { debug } = contenu;

  return (
    <aside className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs">
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        className="font-semibold text-canard-500"
      >
        {debug.titre} ({evenements.length}) · {debug.variant} : {variant}
      </button>

      {ouvert ? (
        evenements.length === 0 ? (
          <p className="mt-2 text-slate-500">{debug.vide}</p>
        ) : (
          <ol className="mt-2 grid gap-1">
            {evenements.map((evenement, index) => (
              <li key={`${evenement.ts}-${index}`} className="font-mono">
                {evenement.event} — {JSON.stringify(evenement)}
              </li>
            ))}
          </ol>
        )
      ) : null}
    </aside>
  );
}
