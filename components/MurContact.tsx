"use client";

import { useState } from "react";

import { track } from "@/lib/analytics";
import { contenu } from "@/lib/content";
import { CTA_PRIMAIRE } from "@/lib/styles";

/**
 * Écran M1 de la variante `?variant=mur` : le tunnel actuel, reproduit pour
 * la démonstration A/B. Le résultat n'est jamais affiché dans cette variante.
 */
export function MurContact() {
  const [envoye, setEnvoye] = useState(false);
  const { mur } = contenu;

  if (envoye) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-col items-center gap-4 p-5 text-center">
        <Etiquette />
        <div className="flex size-20 items-center justify-center rounded-full bg-vert-100 text-3xl text-vert-400">
          ✓
        </div>
        <h1 className="text-2xl font-extrabold text-neutre-700">
          {mur.merci.titre}
        </h1>
        <p className="text-base text-neutre-500">{mur.merci.texte}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-5">
      <Etiquette />

      <h1 className="text-2xl font-extrabold text-corail-600">{mur.titre}</h1>
      <p className="text-base text-neutre-500">{mur.texte}</p>

      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          track("booking_contact_submitted", { ecran: "mur" });
          setEnvoye(true);
        }}
      >
        {mur.champs.map((champ) => (
          <label key={champ} className="flex flex-col gap-1">
            <span className="text-[13px] font-semibold text-neutre-500">
              {champ}
            </span>
            <input
              required
              className="h-12 rounded-xl border border-neutre-300 px-4 text-base text-neutre-700"
            />
          </label>
        ))}

        <p className="rounded-card bg-canard-100 p-3 text-sm text-canard-700">
          {contenu.rdv.coordonnees.mention}
        </p>

        <button
          type="submit"
          className={CTA_PRIMAIRE}
        >
          {mur.cta}
        </button>
      </form>
    </main>
  );
}

function Etiquette() {
  return (
    <p className="self-start rounded-full bg-orange-100 px-3 py-1 text-xs font-extrabold text-neutre-700">
      {contenu.mur.etiquette}
    </p>
  );
}
