"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { track } from "@/lib/analytics";
import { contenu, telNational } from "@/lib/content";
import { setDebug, setVariant, useProjet } from "@/lib/store";

import { DebugPanel } from "./DebugPanel";

/**
 * En-tête applicatif : mot-symbole, lien d'appel instrumenté, panneau debug.
 *
 * `variant` et `debug` ne sont lus que dans le navigateur (`useSearchParams`),
 * jamais côté serveur — d'où le `<Suspense>` qui entoure ce composant dans
 * `app/layout.tsx`.
 */
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

  const { marque, appel } = contenu.global;

  return (
    <>
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-3">
        {/* Mot-symbole, pas de logo : Nunito ExtraBold, corail-600. */}
        <span className="font-sans text-[19px] font-extrabold tracking-tight text-corail-600">
          {marque}
        </span>

        <a
          href={`tel:${telNational()}`}
          onClick={() => track("call_click", { source: "header", step: chemin })}
          className="text-sm font-bold text-canard-500"
        >
          {appel.libelle}
        </a>
      </header>

      {debug ? <DebugPanel /> : null}
    </>
  );
}
