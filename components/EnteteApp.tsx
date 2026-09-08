"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { contenu } from "@/lib/content";
import { setDebug, setDemo, setVariant, useProjet } from "@/lib/store";

import { BoutonAppel } from "./BoutonAppel";
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
  const demoUrl = parametres.get("demo") === "1";

  useEffect(() => {
    setVariant(variantUrl);
    setDebug(debugUrl);
    setDemo(demoUrl);
  }, [variantUrl, debugUrl, demoUrl]);

  return (
    <>
      <header className="flex min-h-14 items-center justify-between gap-4 border-b border-neutre-200 px-5 py-3">
        {/* Mot-symbole, pas de logo : Nunito ExtraBold, corail-600. */}
        <span className="font-sans text-[19px] font-extrabold tracking-tight text-corail-600">
          {contenu.global.marque}
        </span>

        {appelAutorise(chemin) ? (
          <BoutonAppel source="header" step={chemin} />
        ) : null}
      </header>

      {debug ? <DebugPanel /> : null}
    </>
  );
}
