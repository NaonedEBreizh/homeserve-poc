"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { contenu } from "@/lib/content";
import { avecDrapeaux } from "@/lib/navigation";
import { setReponse, type Projet } from "@/lib/store";

import { IllustrationAccueil } from "./ui/pictos";

const PROJETS: Projet[] = ["solaire", "pac", "les_deux"];

function estProjet(valeur: string | null): valeur is Projet {
  return valeur !== null && PROJETS.includes(valeur as Projet);
}

export function Accueil() {
  const parametres = useSearchParams();
  const projetUrl = parametres.get("projet");
  const projet = estProjet(projetUrl) ? projetUrl : undefined;

  // `?projet=` pré-répond A0 : celui qui arrive de la page Solaire ne se voit
  // pas redemander ce qu'il vient de choisir.
  useEffect(() => {
    if (projet) setReponse("projet", projet);
  }, [projet]);

  const { accueil } = contenu;
  const source = projet ? `page_${projet}` : "accueil";
  const contextes = accueil.contexte_projets as Record<string, string>;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 p-5 sm:max-w-3xl">
      {projet ? (
        <p className="rounded-card bg-canard-100 px-4 py-2 text-sm font-bold text-canard-700">
          {accueil.contexte_projet.replace("{projet}", contextes[projet] ?? "")}
        </p>
      ) : null}

      <header className="flex flex-col gap-3">
        <p className="text-[13px] font-extrabold uppercase tracking-wide text-canard-500">
          {accueil.surtitre}
        </p>
        <h1 className="text-[29px] font-extrabold leading-tight tracking-tight text-neutre-700 sm:text-5xl">
          {accueil.titre}
        </h1>
        <ul className="flex flex-wrap gap-2">
          {accueil.badges.map((badge) => (
            <li
              key={badge}
              className="rounded-full bg-vert-100 px-3 py-1 text-xs font-extrabold text-vert-600"
            >
              {badge}
            </li>
          ))}
        </ul>
      </header>

      {/* Maison, panneaux et unité extérieure : le produit avant les portes. */}
      <IllustrationAccueil className="h-28 w-full sm:h-40" />

      <nav className="flex flex-col gap-3">
        <Link
          href={avecDrapeaux("/simulateur", parametres, { source })}
          className="flex min-h-11 flex-col gap-1 rounded-tuile bg-corail-600 p-5 text-white shadow-[0_2px_6px_rgba(226,44,34,0.24)]"
        >
          <span className="text-lg font-extrabold">
            {accueil.porte_simulateur.titre}
          </span>
          <span className="text-sm opacity-90">
            {accueil.porte_simulateur.sous_titre}
          </span>
        </Link>

        <Link
          href={avecDrapeaux("/rendez-vous", parametres, { source })}
          className="flex min-h-11 flex-col gap-1 rounded-tuile border-2 border-neutre-700 bg-white p-5 text-neutre-700"
        >
          <span className="text-lg font-extrabold">
            {accueil.porte_rdv.titre}
          </span>
          <span className="text-sm text-neutre-500">
            {accueil.porte_rdv.sous_titre}
          </span>
        </Link>
      </nav>

      <ul className="flex justify-between gap-3 rounded-card bg-neutre-100 p-4">
        {accueil.chiffres.map((chiffre) => (
          <li key={chiffre.legende} className="flex flex-col">
            <span className="text-lg font-extrabold text-neutre-700">
              {chiffre.valeur}
            </span>
            <span className="text-xs text-neutre-500">{chiffre.legende}</span>
          </li>
        ))}
      </ul>

      <footer className="flex flex-col gap-2 text-xs text-neutre-500">
        <ul className="flex flex-wrap gap-3">
          {accueil.footer.map((lien) => (
            <li key={lien}>{lien}</li>
          ))}
        </ul>
        <p>{accueil.footer_note}</p>
      </footer>
    </main>
  );
}
