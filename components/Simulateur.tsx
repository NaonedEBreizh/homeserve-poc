"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { TRANCHES_FACTURE } from "@/engine/solaire";
import { track } from "@/lib/analytics";
import { contenu } from "@/lib/content";
import { TRANCHES_SURFACE } from "@/lib/entrees";
import { avecDrapeaux } from "@/lib/navigation";
import { setReponse, useProjet, type CleReponse, type Projet } from "@/lib/store";

type TypeQuestion = "choix" | "cp" | "curseur" | "multi";

type Question = {
  id: string;
  cle: CleReponse;
  type: TypeQuestion;
  /** Valeurs des crans, dans l'ordre des libellés du contenu. */
  valeurs?: readonly string[];
  /** Étape du stepper (0 = logement, 1 = équipements). */
  etape: 0 | 1;
  /** Le nœud n'est posé que si la condition est vraie. */
  condition?: (etat: {
    projet?: Projet;
    reponses: Record<string, unknown>;
  }) => boolean;
};

const AVEC_PAC = (etat: { projet?: Projet }) =>
  etat.projet === "pac" || etat.projet === "les_deux";

const QUESTIONS: Question[] = [
  { id: "A0", cle: "projet", type: "choix", etape: 0 },
  { id: "A1", cle: "cp", type: "cp", etape: 0 },
  { id: "A2", cle: "occupation", type: "choix", etape: 0 },
  { id: "A3", cle: "personnes", type: "choix", etape: 0 },
  { id: "A4", cle: "surface_sol", type: "curseur", valeurs: TRANCHES_SURFACE, etape: 0 },
  { id: "A5", cle: "chauffage", type: "choix", etape: 1 },
  {
    id: "A5b",
    cle: "energie_chauffage",
    type: "choix",
    etape: 1,
    condition: (e) => AVEC_PAC(e) && e.reponses.chauffage === "gaz_fioul_bois",
  },
  { id: "A6", cle: "equipements", type: "multi", etape: 1 },
  { id: "A7", cle: "chauffe_eau", type: "choix", etape: 1 },
  { id: "A8", cle: "facture_mensuelle", type: "curseur", valeurs: TRANCHES_FACTURE, etape: 1 },
  // A9 et A10 ne concernent que les parcours avec pompe à chaleur.
  { id: "A9", cle: "revenus", type: "choix", etape: 1, condition: AVEC_PAC },
  { id: "A10", cle: "annee_construction", type: "choix", etape: 1, condition: AVEC_PAC },
];

type ContenuQuestion = {
  titre: string;
  aide?: string;
  intro?: string;
  placeholder?: string;
  options?: Record<string, string>;
  crans?: string[];
  bascule?: Record<string, string>;
};

function contenuDe(id: string): ContenuQuestion {
  const questions = contenu.simulateur.questions as Record<string, ContenuQuestion>;
  const q = questions[id];
  if (!q) throw new Error(`Question absente du contenu : ${id}`);
  return q;
}

export function Simulateur() {
  const router = useRouter();
  const parametres = useSearchParams();
  const etat = useProjet();

  const [index, setIndex] = useState(0);
  const demarrage = useRef(false);

  const posees = QUESTIONS.filter(
    (q) => !q.condition || q.condition({ projet: etat.projet, reponses: etat.reponses }),
  );

  // `sim_start` une seule fois, avec le projet connu et la porte d'entrée.
  useEffect(() => {
    if (demarrage.current) return;
    demarrage.current = true;
    track("sim_start", {
      projet: etat.projet ?? null,
      source: parametres.get("source") ?? "direct",
    });
  }, [etat.projet, parametres]);

  // A0 déjà répondue via `?projet=` : on démarre à la question suivante.
  useEffect(() => {
    if (index === 0 && etat.reponses.projet) setIndex(1);
  }, [index, etat.reponses.projet]);

  const question = posees[Math.min(index, posees.length - 1)];
  if (!question) return null;

  const c = contenuDe(question.id);
  const total = posees.length;
  const numero = Math.min(index, total - 1) + 1;

  function suivant() {
    track(`sim_step_${numero}`, { question: question!.id });

    if (numero >= total) {
      router.push(avecDrapeaux("/resultat", parametres));
      return;
    }
    setIndex(index + 1);
  }

  function repondre(cle: CleReponse, valeur: string | string[]) {
    setReponse(cle, valeur);
    suivant();
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 p-5">
      <Stepper etape={question.etape} numero={numero} total={total} />

      <header className="flex flex-col gap-2">
        {c.intro ? (
          <p className="rounded-card bg-canard-100 px-4 py-3 text-sm text-canard-700">
            {c.intro}
          </p>
        ) : null}
        <h1 className="text-2xl font-extrabold tracking-tight text-neutre-700">
          {c.titre}
        </h1>
        {c.aide ? <p className="text-base text-neutre-500">{c.aide}</p> : null}
      </header>

      {question.type === "choix" ? (
        <Choix
          options={c.options ?? {}}
          valeur={etat.reponses[question.cle]}
          onChoisir={(valeur) => repondre(question.cle, valeur)}
        />
      ) : null}

      {question.type === "cp" ? (
        <CodePostal
          placeholder={c.placeholder ?? ""}
          valeurInitiale={
            typeof etat.reponses.cp === "string" ? etat.reponses.cp : ""
          }
          onValider={(cp) => repondre("cp", cp)}
        />
      ) : null}

      {question.type === "curseur" ? (
        <Curseur
          crans={c.crans ?? []}
          valeurs={question.valeurs ?? []}
          valeur={
            typeof etat.reponses[question.cle] === "string"
              ? (etat.reponses[question.cle] as string)
              : undefined
          }
          onValider={(valeur) => repondre(question.cle, valeur)}
        />
      ) : null}

      {question.type === "multi" ? (
        <Multi
          options={c.options ?? {}}
          valeurs={
            Array.isArray(etat.reponses[question.cle])
              ? (etat.reponses[question.cle] as string[])
              : []
          }
          onValider={(valeurs) => repondre(question.cle, valeurs)}
        />
      ) : null}

      <nav className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIndex(Math.max(index - 1, 0))}
          disabled={index === 0}
          className="flex size-12 items-center justify-center rounded-full border border-neutre-200 text-neutre-700 disabled:opacity-40"
          aria-label={contenu.global.retour}
        >
          ←
        </button>
        {question.type === "choix" ? (
          <span className="text-xs text-neutre-400">
            {contenu.simulateur.choix_auto}
          </span>
        ) : null}
      </nav>
    </main>
  );
}

function Stepper({
  etape,
  numero,
  total,
}: {
  etape: number;
  numero: number;
  total: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <ol className="flex items-center gap-2">
        {contenu.simulateur.stepper.map((libelle, i) => (
          <li key={libelle} className="flex items-center gap-2">
            <span
              className={`flex size-6 items-center justify-center rounded-full text-xs font-extrabold ${
                i === etape
                  ? "bg-corail-600 text-white"
                  : i < etape
                    ? "bg-neutre-700 text-white"
                    : "bg-neutre-300 text-white"
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`text-[13px] ${i === etape ? "font-extrabold text-neutre-700" : "font-bold text-neutre-400"}`}
            >
              {libelle}
            </span>
          </li>
        ))}
      </ol>
      <span className="text-[13px] font-bold text-neutre-400">
        {`${numero} / ${total}`}
      </span>
    </div>
  );
}

function Choix({
  options,
  valeur,
  onChoisir,
}: {
  options: Record<string, string>;
  valeur: unknown;
  onChoisir: (valeur: string) => void;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3">
      {Object.entries(options).map(([cle, libelle]) => {
        const actif = valeur === cle;
        return (
          <li key={cle}>
            <button
              type="button"
              onClick={() => onChoisir(cle)}
              aria-pressed={actif}
              className={`flex min-h-28 w-full items-center rounded-card border p-4 text-left text-base font-bold ${
                actif
                  ? "border-2 border-corail-600 bg-corail-100 text-corail-600"
                  : "border-neutre-200 bg-white text-neutre-700"
              }`}
            >
              {libelle}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function CodePostal({
  placeholder,
  valeurInitiale,
  onValider,
}: {
  placeholder: string;
  valeurInitiale: string;
  onValider: (cp: string) => void;
}) {
  const [cp, setCp] = useState(valeurInitiale);
  const valide = /^\d{5}$/.test(cp);

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (valide) onValider(cp);
      }}
    >
      <input
        inputMode="numeric"
        autoComplete="postal-code"
        maxLength={5}
        value={cp}
        placeholder={placeholder}
        onChange={(e) => setCp(e.target.value.replace(/\D/g, ""))}
        aria-label={contenu.simulateur.questions.A1.titre}
        className="h-12 rounded-xl border border-neutre-300 px-4 text-base text-neutre-700"
      />
      <button
        type="submit"
        disabled={!valide}
        className="min-h-14 rounded-full bg-corail-600 text-lg font-extrabold text-white disabled:opacity-40"
      >
        {contenu.global.continuer}
      </button>
    </form>
  );
}

function Curseur({
  crans,
  valeurs,
  valeur,
  onValider,
}: {
  crans: string[];
  valeurs: readonly string[];
  valeur?: string;
  onValider: (valeur: string) => void;
}) {
  const depart = valeur ? Math.max(valeurs.indexOf(valeur), 0) : 2;
  const [index, setIndex] = useState(depart);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[22px] font-extrabold text-corail-600">
        {crans[index]}
      </p>

      <input
        type="range"
        min={0}
        max={Math.max(valeurs.length - 1, 0)}
        step={1}
        value={index}
        onChange={(e) => setIndex(Number(e.target.value))}
        aria-label={crans[index]}
        aria-valuetext={crans[index]}
        className="h-11 w-full accent-corail-600"
      />

      <ul className="flex justify-between text-xs">
        {crans.map((cran, i) => (
          <li
            key={cran}
            className={
              i === index ? "font-extrabold text-corail-600" : "text-neutre-400"
            }
          >
            {cran}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onValider(valeurs[index]!)}
        className="min-h-14 rounded-full bg-corail-600 text-lg font-extrabold text-white"
      >
        {contenu.global.continuer}
      </button>
    </div>
  );
}

function Multi({
  options,
  valeurs,
  onValider,
}: {
  options: Record<string, string>;
  valeurs: string[];
  onValider: (valeurs: string[]) => void;
}) {
  const [choisis, setChoisis] = useState<string[]>(valeurs);

  function basculer(cle: string) {
    // « Aucun » est exclusif : le cocher vide la sélection.
    if (cle === "aucun") {
      setChoisis(choisis.includes("aucun") ? [] : ["aucun"]);
      return;
    }
    const sans = choisis.filter((c) => c !== "aucun");
    setChoisis(
      sans.includes(cle) ? sans.filter((c) => c !== cle) : [...sans, cle],
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="self-start rounded-full bg-corail-100 px-3 py-1 text-xs font-extrabold text-corail-600">
        {(() => {
          const n = choisis.filter((c) => c !== "aucun").length;
          const modele =
            n > 1
              ? contenu.simulateur.compteur_selection.pluriel
              : contenu.simulateur.compteur_selection.singulier;
          return modele.replace("{n}", String(n));
        })()}
      </p>

      <ul className="grid grid-cols-2 gap-2.5">
        {Object.entries(options).map(([cle, libelle]) => {
          const actif = choisis.includes(cle);
          return (
            <li key={cle} className={cle === "aucun" ? "col-span-2" : undefined}>
              <button
                type="button"
                onClick={() => basculer(cle)}
                aria-pressed={actif}
                className={`flex min-h-24 w-full items-center rounded-card border p-4 text-left text-sm font-bold ${
                  actif
                    ? "border-2 border-corail-600 bg-corail-100 text-corail-600"
                    : "border-neutre-200 bg-white text-neutre-700"
                }`}
              >
                {libelle}
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={() => onValider(choisis)}
        className="min-h-14 rounded-full bg-corail-600 text-lg font-extrabold text-white"
      >
        {contenu.global.continuer}
      </button>
    </div>
  );
}
