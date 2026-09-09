"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import agencesJson from "@/data/agences.json";
import arbre from "@/data/arbre-rdv.json";
import { trouverAgence, type Agence, type Creneau } from "@/engine/agenda";
import {
  creerMachine,
  type Machine,
  type ChampNoeud,
  type Noeud,
  type OptionNoeud,
} from "@/engine/machine";
import { track } from "@/lib/analytics";
import { contenu } from "@/lib/content";
import { avecDrapeaux } from "@/lib/navigation";
import { creneauVersRdv, enregistrerRdv, lireRdvExistants } from "@/lib/rdv";
import { setRdv, useHydrate, useProjet, type ProjetState } from "@/lib/store";
import { BANDEAU_INFO, CARTE_OPTION, CTA_PRIMAIRE } from "@/lib/styles";

import { PictoOption } from "./ui/pictos";

import { Calendrier } from "./rdv/Calendrier";
import { PanneauReponses, type LigneReponse } from "./rdv/PanneauReponses";

const AGENCES = agencesJson.agences as unknown as Agence[];

/** Clés que le simulateur transmet au parcours (cartographie §6). */
const CLES_PREFILL = [
  "projet",
  "cp",
  "surface_sol",
  "facture_mensuelle",
  "annee_construction",
  "chauffage",
] as const;

function prefillDepuisEtat(etat: ProjetState): Record<string, string> {
  const prefill: Record<string, string> = {};

  for (const cle of CLES_PREFILL) {
    const valeur = etat.reponses[cle];
    if (typeof valeur === "string") prefill[cle] = valeur;
  }
  return prefill;
}

export function MachineRdv() {
  const router = useRouter();
  const parametres = useSearchParams();
  const etat = useProjet();
  const hydrate = useHydrate();

  const machineRef = useRef<Machine | null>(null);
  const [, forcerRendu] = useState(0);
  const rafraichir = useCallback(() => forcerRendu((n) => n + 1), []);

  const prefill = useMemo(() => prefillDepuisEtat(etat), [etat]);

  // La machine se crée une fois le store hydraté : la porte tiède doit
  // disposer de ses réponses avant que le premier nœud soit calculé.
  if (hydrate && !machineRef.current) {
    machineRef.current = creerMachine(arbre as never, {
      prefill,
      projet: etat.projet,
      contexte: { rdvExistants: lireRdvExistants() },
    });
    track("booking_start", {
      source: parametres.get("source") ?? "direct",
      prefill: Object.keys(prefill).length > 0,
    });
  }

  const machine = machineRef.current;
  const position = machine?.courant();

  // Une sortie quitte le parcours : on mémorise les règles déclenchées pour
  // que /sortie/[code] puisse les expliquer, puis on navigue.
  useEffect(() => {
    if (!machine || position?.type !== "sortie") return;

    const { nonEligible } = machine.etat();
    setRdv({ nonEligible, sortie: position.code });
    track(`booking_exit_${position.code}`, { nonEligible });
    router.replace(avecDrapeaux(`/sortie/${position.code}`, parametres));
  }, [machine, position, router, parametres]);

  // Un nœud `regle` est un calcul, pas un écran : il n'a ni titre ni texte.
  // On le franchit sans rien afficher, plutôt que de montrer un écran vide.
  useEffect(() => {
    if (position?.type === "noeud" && position.noeud.type === "regle") {
      machine?.avancer();
      rafraichir();
    }
  }, [position, machine, rafraichir]);

  if (!hydrate || !machine || !position) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-5">
        <div className="h-8 w-2/3 animate-pulse rounded bg-neutre-100" />
        <div className="h-40 animate-pulse rounded-tuile bg-neutre-100" />
      </main>
    );
  }
  if (position.type === "sortie") return null;

  const { id, noeud } = position;
  const etatMachine = machine.etat();

  const pilote = machine;

  function repondre(valeur: Parameters<Machine["repondre"]>[0]) {
    track(`booking_step_${etatMachine.historique.length + 1}`, { noeud: id });
    pilote.repondre(valeur);
    rafraichir();
  }

  function avancer() {
    pilote.avancer();
    rafraichir();
  }

  const lignes: LigneReponse[] = CLES_PREFILL.filter(
    (cle) => typeof etat.reponses[cle] === "string",
  ).map((cle) => ({
    cle,
    libelle: LIBELLES_PREFILL[cle],
    valeur: String(etat.reponses[cle]),
    herite: true,
  }));

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 p-5">
      <h1 className="text-2xl font-extrabold text-neutre-700">
        {contenu.rdv.titre}
      </h1>

      {lignes.length === 0 ? (
        <p className={BANDEAU_INFO}>{contenu.rdv.porte_chaude}</p>
      ) : null}

      <PanneauReponses lignes={lignes} />

      <NoeudRendu
        id={id}
        noeud={noeud}
        cp={cpDe(etatMachine.reponses, etat)}
        options={pilote.optionsDe(noeud)}
        etat={etat}
        onRepondre={repondre}
        onAvancer={avancer}
        onCreneau={(creneau, agence, distanceKm) => {
          const coordonnees = coordonneesDe(etatMachine.reponses);
          const consentements = consentementsDe(etatMachine.reponses);
          const rdv = creneauVersRdv(
            creneau,
            coordonnees,
            agence,
            distanceKm,
            contenu.rdv.confirmation.type_rdv,
          );
          enregistrerRdv({ ...rdv, ...consentements });
          setRdv({
            agence: agence.nom,
            creneau: creneau.debut.toISOString(),
            typeRdv: rdv.typeRdv,
          });
          track("booking_slot_selected", { agence: agence.id });
          repondre(creneau.debut.toISOString());
        }}
        onAucunCreneau={() => {
          track("callback_requested", { source: "calendrier" });
          router.push(avecDrapeaux("/sortie/R1", parametres));
        }}
        onConfirmation={() => {
          track("booking_slot_confirmed", {});
          router.push(avecDrapeaux("/confirmation", parametres));
        }}
      />

      {etatMachine.historique.length > 0 ? (
        <button
          type="button"
          onClick={() => {
            pilote.retour();
            rafraichir();
          }}
          className="flex size-12 items-center justify-center self-start rounded-full border border-neutre-200 text-neutre-700"
          aria-label={contenu.global.retour}
        >
          ←
        </button>
      ) : null}
    </main>
  );
}

const LIBELLES_PREFILL: Record<(typeof CLES_PREFILL)[number], string> = {
  projet: "Projet",
  cp: "Code postal",
  surface_sol: "Surface",
  facture_mensuelle: "Facture",
  annee_construction: "Construction",
  chauffage: "Chauffage",
};

/**
 * Code postal courant : saisi en B14 dans la machine (porte chaude) ou hérité
 * du simulateur (porte tiède). Le lire uniquement dans le store laissait la
 * porte chaude sans agence.
 */
function cpDe(
  reponsesMachine: Record<string, unknown>,
  etat: ProjetState,
): string {
  for (const valeur of Object.values(reponsesMachine)) {
    if (!valeur || typeof valeur !== "object" || Array.isArray(valeur)) continue;
    const champs = valeur as Record<string, string>;
    if (champs.cp) return champs.cp;
  }
  return typeof etat.reponses.cp === "string" ? etat.reponses.cp : "";
}

/** Consentements recueillis en B16, horodatés au moment de la réservation. */
function consentementsDe(reponses: Record<string, unknown>) {
  let contact = false;
  let marketing = false;

  for (const valeur of Object.values(reponses)) {
    if (!valeur || typeof valeur !== "object" || Array.isArray(valeur)) continue;
    const champs = valeur as Record<string, string>;
    if (champs.consentement_contact === "true") contact = true;
    if (champs.consentement_marketing === "true") marketing = true;
  }

  return {
    consentementContact: contact,
    consentementMarketing: marketing,
    consentementHorodatage: new Date().toISOString(),
  };
}

function coordonneesDe(reponses: Record<string, unknown>): {
  telephone: string;
  email: string;
} {
  let telephone = "";
  let email = "";

  for (const valeur of Object.values(reponses)) {
    if (!valeur || typeof valeur !== "object" || Array.isArray(valeur)) continue;
    const champs = valeur as Record<string, string>;
    if (champs.telephone) telephone = champs.telephone;
    if (champs.email) email = champs.email;
  }
  return { telephone, email };
}

/**
 * Libellé d'une case à cocher, avec le lien réel quand le champ en porte un
 * (D51 : la politique de données personnelles doit être atteignable).
 */
function LibelleAvecLien({ champ }: { champ: ChampNoeud }) {
  const libelle = champ.libelle ?? champ.id;
  if (!champ.lien) return <>{libelle}</>;

  const [avant, apres] = libelle.split(champ.lien.libelle);
  return (
    <>
      {avant}
      <a
        href={champ.lien.url}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="font-bold text-canard-700 underline"
      >
        {champ.lien.libelle}
      </a>
      {apres}
    </>
  );
}

/** Rend le nœud courant selon son `type`, sans rien décider du parcours. */
function NoeudRendu({
  id,
  noeud,
  cp,
  options,
  etat,
  onRepondre,
  onAvancer,
  onCreneau,
  onAucunCreneau,
  onConfirmation,
}: {
  id: string;
  noeud: Noeud;
  cp: string;
  options: OptionNoeud[];
  etat: ProjetState;
  onRepondre: (valeur: Parameters<Machine["repondre"]>[0]) => void;
  onAvancer: () => void;
  onCreneau: (creneau: Creneau, agence: Agence, distanceKm: number) => void;
  onAucunCreneau: () => void;
  onConfirmation: () => void;
}) {
  const question = (
    <h2 className="text-xl font-extrabold text-neutre-700">
      {noeud.titre ?? noeud.question}
    </h2>
  );

  if (noeud.type === "choix") {
    return (
      <section className="flex flex-col gap-3">
        {question}
        {noeud.aide ? (
          <p className={BANDEAU_INFO}>{noeud.aide}</p>
        ) : null}
        <ul className="flex flex-col gap-2.5">
          {options.map((option) => (
            <li key={option.valeur}>
              <button
                type="button"
                onClick={() => onRepondre(option.valeur)}
                className={`${CARTE_OPTION} min-h-16 text-base font-bold text-neutre-700`}
              >
                <PictoOption cle={option.valeur} taille={24} />
                {option.libelle ?? option.valeur}
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (noeud.type === "form" || noeud.type === "otp") {
    return (
      <Formulaire
        id={id}
        noeud={noeud}
        etat={etat}
        onRepondre={onRepondre}
      />
    );
  }

  if (noeud.type === "calendrier") {
    const routage = trouverAgence(cp, AGENCES);

    if (!routage) {
      return (
        <p className="text-sm text-neutre-500">
          {contenu.rdv.calendrier.jour_sans}
        </p>
      );
    }

    return (
      <Calendrier
        agence={routage.agence}
        distanceKm={routage.distanceKm}
        confirmationDecideurs={noeud.confirmation_decideurs}
        cp={cp}
        aujourdhui={new Date()}
        onConfirmer={(creneau) =>
          onCreneau(creneau, routage.agence, routage.distanceKm)
        }
        onAucunCreneau={onAucunCreneau}
      />
    );
  }

  // info, regle : un écran, un bouton, un pas de machine.
  const estConfirmation = noeud.ecran === "confirmation";

  return (
    <section className="flex flex-col gap-3">
      {question}
      {noeud.texte ? (
        <p className="text-base text-neutre-500">{noeud.texte}</p>
      ) : null}
      {noeud.badge ? (
        <p className="self-start rounded-full bg-orange-100 px-3 py-1 text-xs font-extrabold text-neutre-700">
          {noeud.badge}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => {
          if (estConfirmation) {
            onConfirmation();
            return;
          }
          if (noeud.type === "info" && noeud.modale) track("booking_engaged", {});
          onAvancer();
        }}
        className={CTA_PRIMAIRE}
      >
        {noeud.bouton ?? contenu.global.continuer}
      </button>
    </section>
  );
}

function Formulaire({
  id,
  noeud,
  etat,
  onRepondre,
}: {
  id: string;
  noeud: Noeud;
  etat: ProjetState;
  onRepondre: (valeur: Record<string, string>) => void;
}) {
  const champs = noeud.champs ?? [];
  const [valeurs, setValeurs] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    const reponses = etat.reponses as Record<string, unknown>;
    for (const champ of champs) {
      const herite = champ.prefill ? reponses[champ.prefill] : undefined;
      if (typeof herite === "string") initial[champ.id] = herite;
    }
    return initial;
  });
  const [code, setCode] = useState("");

  if (noeud.type === "otp") {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-extrabold text-neutre-700">
          {noeud.question}
        </h2>
        <p className="self-start rounded-full bg-orange-100 px-3 py-1 text-xs font-extrabold text-neutre-700">
          {contenu.rdv.otp.demo.replace("{code}", String(noeud.code_demo))}
        </p>
        <input
          inputMode="numeric"
          maxLength={4}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          aria-label={contenu.rdv.otp.titre}
          className="h-16 w-40 rounded-xl border border-neutre-300 text-center text-2xl font-extrabold tracking-[0.5em] text-neutre-700"
        />
        <p className="text-xs text-neutre-500">{contenu.rdv.otp.aide}</p>
        <button
          type="button"
          disabled={code.length !== 4}
          onClick={() => {
            track("booking_otp_ok", {});
            onRepondre({ code });
          }}
          className={`${CTA_PRIMAIRE} disabled:opacity-40`}
        >
          {contenu.global.continuer}
        </button>
      </section>
    );
  }

  // Une case requise doit valoir « true », pas seulement être non vide (D51).
  const complet = champs.every((champ) => {
    if (!champ.requis) return true;
    const valeur = valeurs[champ.id] ?? "";
    return champ.type === "checkbox" ? valeur === "true" : valeur.trim().length > 0;
  });

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!complet) return;
        if (id === "B16") track("booking_contact_submitted", {});
        onRepondre(valeurs);
      }}
    >
      <h2 className="text-xl font-extrabold text-neutre-700">
        {noeud.question}
      </h2>

      {champs.map((champ) => (
        <label
          key={champ.id}
          className={
            champ.type === "checkbox"
              ? "flex items-start gap-2 text-sm text-neutre-700"
              : "flex flex-col gap-1"
          }
        >
          {champ.type === "checkbox" ? null : (
            <span className="text-[13px] font-semibold text-neutre-500">
              {champ.libelle ?? champ.id}
            </span>
          )}
          {champ.type === "checkbox" ? (
            <input
              type="checkbox"
              checked={valeurs[champ.id] === "true"}
              onChange={(e) =>
                setValeurs({ ...valeurs, [champ.id]: String(e.target.checked) })
              }
              className="size-6 shrink-0 accent-corail-600"
            />
          ) : (
            <input
              required={champ.requis}
              inputMode={champ.type === "cp" || champ.type === "tel" ? "numeric" : undefined}
              type={champ.type === "email" ? "email" : "text"}
              value={valeurs[champ.id] ?? ""}
              onChange={(e) =>
                setValeurs({ ...valeurs, [champ.id]: e.target.value })
              }
              className="h-12 rounded-xl border border-neutre-300 px-4 text-base text-neutre-700"
            />
          )}
          {champ.type === "checkbox" ? (
            <span>
              <LibelleAvecLien champ={champ} />
              {champ.requis ? (
                <span aria-hidden="true" className="text-corail-600">
                  {" *"}
                </span>
              ) : null}
            </span>
          ) : null}

          {champ.aide ? (
            <span className="text-xs text-neutre-500">{champ.aide}</span>
          ) : null}
        </label>
      ))}

      {noeud.mention ? (
        <p className={BANDEAU_INFO}>{noeud.mention}</p>
      ) : null}

      <button
        type="submit"
        disabled={!complet}
        className={`${CTA_PRIMAIRE} disabled:opacity-40`}
      >
        {id === "B16" ? contenu.rdv.coordonnees.cta_code : contenu.global.continuer}
      </button>
    </form>
  );
}
