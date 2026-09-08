"use client";

import { contenu } from "@/lib/content";

export type LigneReponse = {
  cle: string;
  libelle: string;
  valeur: string;
  herite: boolean;
};

/**
 * « Vos réponses » : ce que le simulateur a déjà donné, marqué comme repris,
 * avec un crayon pour y revenir. La porte chaude arrive avec un panneau vide
 * et l'explication qui va avec.
 */
export function PanneauReponses({
  lignes,
  onModifier,
}: {
  lignes: LigneReponse[];
  onModifier?: (cle: string) => void;
}) {
  const { panneau_reponses } = contenu.rdv;

  return (
    <details className="rounded-card border border-neutre-200 p-4" open>
      <summary className="min-h-11 cursor-pointer text-base font-extrabold text-neutre-700">
        {panneau_reponses.titre}
      </summary>

      {lignes.length === 0 ? (
        <p className="mt-2 text-sm text-neutre-500">{panneau_reponses.vide}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {lignes.map((ligne) => (
            <li key={ligne.cle} className="flex items-center gap-2 text-[15px]">
              <span className="text-neutre-500">{ligne.libelle}</span>
              <span className="font-extrabold text-neutre-700">
                {ligne.valeur}
              </span>
              {ligne.herite ? (
                <span className="rounded-full bg-canard-100 px-2 py-0.5 text-[11px] font-extrabold text-canard-700">
                  {panneau_reponses.badge_herite}
                </span>
              ) : null}
              {onModifier ? (
                <button
                  type="button"
                  onClick={() => onModifier(ligne.cle)}
                  aria-label={`${panneau_reponses.modifier} : ${ligne.libelle}`}
                  className="ml-auto flex size-11 items-center justify-center text-corail-500"
                >
                  ✎
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
