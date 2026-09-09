"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { contenu } from "@/lib/content";
import { setDebug, setVariant, useProjet } from "@/lib/store";

import { PictoMaison } from "./ui/pictos";

import { BoutonAppel, MentionHoraires } from "./BoutonAppel";
import { DebugPanel } from "./DebugPanel";

/**
 * Chemins où le bouton d'appel a sa place (D34) : l'accueil, les écrans de
 * sortie et la confirmation. Il disparaît dès l'entrée dans un parcours —
 * simulateur, résultat, rendez-vous — pour ne pas court-circuiter l'étape.
 */
function appelAutorise(chemin: string): boolean {
  return (
    chemin === "/" || chemin.startsWith("/sortie") || chemin === "/confirmation"
  );
}

export function EnteteApp() {
  const parametres = useSearchParams();
  const chemin = usePathname();
  const { debug } = useProjet();

  const variantUrl = parametres.get("variant") === "mur" ? "mur" : "defaut";
  const debugUrl = parametres.get("debug") === "1";

  useEffect(() => {
    setVariant(variantUrl);
    setDebug(debugUrl);
  }, [variantUrl, debugUrl]);

  return (
    <>
      <header className="border-b border-neutre-200">
        <div className="flex min-h-14 items-center justify-between gap-4 px-5 py-3">
          {/* Mot-symbole précédé d'un pictogramme original (toit + panneau) :
              aucune reprise du logo officiel. */}
          <span className="flex items-center gap-2">
            <PictoMaison taille={28} />
            <span className="font-sans text-[19px] font-extrabold tracking-tight text-corail-600">
              {contenu.global.marque}
            </span>
          </span>

          {appelAutorise(chemin) ? (
            <BoutonAppel source="header" step={chemin} />
          ) : null}
        </div>

        {/* D54 : la page produit annonce les horaires sous le lien d'appel. */}
        {chemin === "/" ? <MentionHoraires /> : null}
      </header>

      {debug ? <DebugPanel /> : null}
    </>
  );
}
