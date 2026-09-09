"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import baremes from "@/data/pac-baremes.json";
import { contenu } from "@/lib/content";
import { euros, remplacer } from "@/lib/format";
import { avecDrapeaux } from "@/lib/navigation";
import { setReponse, type Projet } from "@/lib/store";

import { IllustrationAccueil, IllustrationPac, IllustrationToit } from "./ui/pictos";

const PROJETS: Projet[] = ["solaire", "pac", "les_deux"];

function estProjet(valeur: string | null): valeur is Projet {
  return valeur !== null && PROJETS.includes(valeur as Projet);
}

/**
 * Aides PAC maximales : meilleur profil MaPrimeRénov' plus meilleure zone
 * CEE. Le chiffre de l'accroche vient du barème, pas d'une saisie — il ne
 * peut donc pas contredire ce que l'écran de résultat annoncera.
 */
function aidesPacMax(): number {
  const mpr = Math.max(
    ...Object.values(baremes.maprimerenov_2026_pac_air_eau.par_profil),
  );
  const cee = Math.max(
    ...Object.values(baremes.cee_coup_de_pouce_pac.remplacement_fossile_par_zone),
  );
  return mpr + cee;
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

  // D54 : gabarit de page produit. Sans `?projet=`, c'est la page solaire —
  // la porte d'entrée la plus fréquente sur homeserve.fr.
  const produit = accueil.produit[projet ?? "solaire"];
  const accroche = remplacer(produit.accroche, { aides: euros(aidesPacMax()) });

  const Illustration =
    projet === "pac"
      ? IllustrationPac
      : projet === "les_deux"
        ? IllustrationAccueil
        : IllustrationToit;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 p-5 sm:max-w-3xl">
      {projet ? (
        <p className="rounded-card bg-canard-100 px-4 py-2 text-sm font-bold text-canard-700">
          {accueil.contexte_projet.replace("{projet}", contextes[projet] ?? "")}
        </p>
      ) : null}

      {/* Section produit : vocabulaire HomeServe, textes originaux. */}
      <section className="flex flex-col gap-3">
        <p className="text-[13px] font-extrabold uppercase tracking-wide text-canard-500">
          {accueil.surtitre}
        </p>
        <h1 className="text-[29px] font-extrabold leading-tight tracking-tight text-neutre-700 sm:text-5xl">
          {produit.titre}
          <span className="block text-corail-600">{accroche}</span>
        </h1>

        <Illustration className="h-24 w-full sm:h-36" />

        <p className="text-[17px] text-neutre-700">{produit.texte}</p>

        <ul className="flex flex-wrap gap-2">
          {produit.preuves.map((preuve) => (
            <li
              key={preuve}
              className="rounded-full bg-vert-100 px-3 py-1 text-xs font-extrabold text-vert-600"
            >
              {preuve}
            </li>
          ))}
        </ul>
      </section>

      {/* Bloc d'orientation : une porte tiède, une porte chaude. */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-extrabold text-neutre-700">
          {accueil.ou_en_etes_vous}
        </h2>

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
      </section>

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
