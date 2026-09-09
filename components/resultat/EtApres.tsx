"use client";

import { useEffect, useRef } from "react";

import { track } from "@/lib/analytics";
import { contenu } from "@/lib/content";
import { PictoOption } from "@/components/ui/pictos";

/**
 * « Et après ? » (D44) — entre la carte pack et le CTA. Elle répond à la
 * question que se pose quelqu'un qui vient de voir un chiffre : à quoi
 * m'engage l'étape suivante, et qu'est-ce que j'y gagne ?
 *
 * L'événement `sim_next_steps_viewed` part une seule fois, à l'entrée dans
 * le viewport : c'est ce qui permettra de savoir si la section est lue.
 */
export function EtApres() {
  const ref = useRef<HTMLElement>(null);
  const vu = useRef(false);

  useEffect(() => {
    const cible = ref.current;
    if (!cible || vu.current) return;

    // IntersectionObserver peut manquer dans un environnement de test.
    if (typeof IntersectionObserver === "undefined") {
      vu.current = true;
      track("sim_next_steps_viewed", {});
      return;
    }

    const observateur = new IntersectionObserver(
      (entrees) => {
        for (const entree of entrees) {
          if (entree.isIntersecting && !vu.current) {
            vu.current = true;
            track("sim_next_steps_viewed", {});
            observateur.disconnect();
          }
        }
      },
      { threshold: 0.3 },
    );

    observateur.observe(cible);
    return () => observateur.disconnect();
  }, []);

  const { et_apres } = contenu.resultat;

  return (
    <section ref={ref} className="flex flex-col gap-4">
      <h2 className="text-xl font-extrabold text-neutre-700">
        {et_apres.titre}
      </h2>

      <ol className="flex flex-col gap-2">
        {et_apres.etapes.map((etape, i) => {
          // L'étape suivante est celle qu'on veut faire lire : elle sort de la
          // liste et devient une carte.
          if (etape.mise_en_avant) {
            return (
              <li
                key={etape.titre}
                className="flex items-center gap-3 rounded-tuile border-2 border-corail-600 bg-white p-4 shadow-[0_1px_3px_rgba(30,30,30,0.06)]"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-corail-100 text-corail-600">
                  <PictoOption cle="calendrier" taille={24} />
                </span>
                <span className="flex flex-col">
                  <span className="text-base font-extrabold text-neutre-700">
                    {etape.titre}
                  </span>
                  <span className="text-sm text-neutre-500">{etape.detail}</span>
                </span>
              </li>
            );
          }

          return (
            <li key={etape.titre} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                  etape.faite
                    ? "bg-vert-100 text-vert-600"
                    : "border border-neutre-300 text-neutre-500"
                }`}
              >
                {etape.faite ? "✓" : i + 1}
              </span>
              <span className="flex flex-col">
                <span
                  className={`text-[15px] font-extrabold ${etape.faite ? "text-vert-600" : "text-neutre-700"}`}
                >
                  {etape.titre}
                </span>
                {etape.detail ? (
                  <span className="text-sm text-neutre-500">{etape.detail}</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-col gap-2 rounded-tuile bg-canard-100 p-4">
        <h3 className="text-base font-extrabold text-canard-700">
          {et_apres.carte.titre}
        </h3>
        <ul className="flex flex-col gap-1.5 text-sm text-neutre-700">
          {et_apres.carte.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="text-sm font-extrabold text-canard-700">
          {et_apres.carte.mention}
        </p>
      </div>

      <ul className="flex flex-wrap gap-2">
        {et_apres.preuves.map((preuve) => (
          <li
            key={preuve}
            className="rounded-full bg-neutre-100 px-3 py-1 text-xs font-bold text-neutre-700"
          >
            {preuve}
          </li>
        ))}
      </ul>
    </section>
  );
}
