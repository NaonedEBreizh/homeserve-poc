"use client";

import { useState, type ReactNode } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { track } from "@/lib/analytics";
import { contenu } from "@/lib/content";

export type OngletComprendre = {
  cle: string;
  titre: string;
  texte: string;
  /** Vignette : le bloc réel du résultat, rendu en mode aperçu. */
  vignette: ReactNode;
  /** Impact chiffré, quand il en existe un pour ce bloc. */
  impacts?: string[];
};

/**
 * « Comprendre mes résultats » (D27/D37) : un onglet par bloc du résultat,
 * une seule ligne ouverte à la fois. Chaque onglet montre d'abord le bloc
 * concerné — le même composant, réduit et inerte, avec les valeurs courantes —
 * puis l'explique.
 */
export function PanneauComprendre({ onglets }: { onglets: OngletComprendre[] }) {
  const [ouvert, setOuvert] = useState<string | null>(onglets[0]?.cle ?? null);
  const panneau = contenu.resultat.comprendre_panneau;

  return (
    <Dialog>
      <DialogTrigger
        onClick={() => track("sim_hypotheses_opened", { panneau: "comprendre" })}
        aria-label={contenu.resultat.comprendre}
        className="flex size-11 items-center justify-center rounded-full border-2 border-canard-500 text-lg font-extrabold text-canard-500"
      >
        ?
      </DialogTrigger>

      <DialogContent pleinEcran>
        {/* En-tête collant : le bouton fermer reste atteignable au défilement. */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-neutre-200 bg-white px-5 py-4">
          <DialogTitle className="text-xl font-extrabold text-neutre-700">
            {panneau.titre}
          </DialogTitle>
          <DialogClose className="flex min-h-11 items-center rounded-full border border-neutre-200 px-4 text-sm font-bold text-canard-500">
            {panneau.fermer}
          </DialogClose>
        </div>

        <ul className="flex flex-1 flex-col divide-y divide-neutre-200 overflow-y-auto px-5 pb-8">
          {onglets.map((onglet) => {
            const actif = ouvert === onglet.cle;

            return (
              <li key={onglet.cle}>
                <button
                  type="button"
                  onClick={() => setOuvert(actif ? null : onglet.cle)}
                  aria-expanded={actif}
                  className="flex min-h-11 w-full items-center justify-between gap-3 py-3 text-left text-base font-extrabold text-neutre-700"
                >
                  {onglet.titre}
                  <span aria-hidden="true" className="text-canard-500">
                    {actif ? "−" : "+"}
                  </span>
                </button>

                {actif ? (
                  <div className="flex flex-col gap-3 pb-4">
                    <div className="rounded-card bg-neutre-100 p-2">
                      {onglet.vignette}
                    </div>
                    <p className="text-[15px] leading-relaxed text-neutre-500">
                      {onglet.texte}
                    </p>
                    {onglet.impacts?.length ? (
                      <ul className="flex flex-col gap-1">
                        {onglet.impacts.map((impact) => (
                          <li
                            key={impact}
                            className="text-sm font-bold text-canard-700"
                          >
                            {impact}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
