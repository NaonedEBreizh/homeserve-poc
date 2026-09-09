/**
 * Interpréteur de l'arbre de qualification (`data/arbre-rdv.json`).
 *
 * L'arbre est la source de vérité : changer un seuil, une cible ou une sortie
 * ne touche aucun `.ts`. L'interpréteur ne fait qu'appliquer six règles :
 *
 * 1. non-répétition — un nœud dont la clé `prefill` est déjà connue est sauté,
 *    mais sa règle `pe` est évaluée sur la valeur héritée ;
 * 2. `condition.projet` — le nœud n'est posé que pour les projets listés,
 *    sinon on saute à `next_sinon` ;
 * 3. `pe` — ajoute une règle à `nonEligible` sans interrompre le parcours ;
 * 4. `guard` — garde géographique de B14 (préfixes hors zone, CP de test,
 *    agence dans le rayon) ;
 * 5. nœuds `regle` — prospect existant, éligibilité, disponibilité d'agence ;
 * 6. `note_technicien` — accumulée pour la visite.
 *
 * Une règle de rentabilité, une zone non couverte ou une agence saturée ne
 * ferment plus le parcours (D57) : elles mènent à un nœud `orientation`, où le
 * prospect choisit de réserver quand même ou de suivre une offre alternative.
 * Le prototype ne propose aucune demande de rappel (D58).
 *
 * Les nœuds `regle`, `info` et `calendrier` ne s'exécutent pas d'eux-mêmes :
 * l'appelant enchaîne avec `avancer()`, un nœud à la fois.
 */
import agencesJson from "@/data/agences.json";

import {
  CP_TEST_SURBOOKEE,
  estSurbookee,
  genererCreneaux,
  trouverAgence,
  type Agence,
} from "./agenda";

// ------------------------------------------------------------------ types

export type Projet = "solaire" | "pac" | "les_deux";

export type ValeurReponse = string | string[] | Record<string, string>;

export type OptionNoeud = {
  valeur: string;
  libelle?: string;
  cible?: string;
  cible_si?: Record<string, string>;
  note_technicien?: string;
  /** D57 : écran d'orientation — l'option de tête, mise en avant. */
  primaire?: boolean;
  /** D57 : orientation externe (offre HomeServe réelle) plutôt qu'une cible. */
  url?: string;
  /** D57 : l'option n'est proposée que pour les projets listés. */
  condition?: { projet: string[] };
  /**
   * D57 : note le code de chaque règle déclenchée (`regle:<code>`), pour que
   * le technicien sache dans quel contexte la visite a été réservée.
   */
  note_regles?: boolean;
};

export type RegleEligibilite = {
  op: string;
  valeur: string;
  regle: string;
  condition?: { projet: string[] };
};

export type ChampNoeud = {
  id: string;
  libelle?: string;
  type?: string;
  requis?: boolean;
  aide?: string;
  prefill?: string;
  /**
   * Note technicien ajoutée quand la valeur saisie diffère de celle héritée
   * du simulateur : `{avant}` et `{apres}` y sont substitués.
   */
  note_si_different?: string;
};

export type Noeud = {
  type: string;
  question?: string;
  options?: OptionNoeud[];
  /** Jeu d'options restreint pour un projet solaire seul (D49). */
  options_solaire?: OptionNoeud[];
  champs?: ChampNoeud[];
  // Champs de présentation portés par data/arbre-rdv.json : l'interpréteur ne
  // les lit pas, les écrans du module B les rendent tels quels.
  titre?: string;
  texte?: string;
  /** D57 : texte de l'écran d'orientation, une entrée par règle déclenchée. */
  texte_par_regle?: Record<string, string>;
  /** D57 : événement à émettre à l'affichage ; `{regle}` est substitué. */
  evenement?: string;
  aide?: string;
  badge?: string;
  bouton?: string;
  mention?: string;
  ecran?: string;
  modale?: boolean;
  mock?: boolean;
  code_demo?: string;
  next?: string | null;
  next_sinon?: string;
  prefill?: string;
  prefill_si?: Record<string, Record<string, string>>;
  pe?: RegleEligibilite;
  condition?: { projet: string[] };
  guard?: {
    type: string;
    hors_zone_prefixes?: string[];
    exception_test?: string;
    rayon_km?: number;
    cible: string;
  };
  regle?: string;
  cas?: Array<{ test: string; valeur?: string; cible: string }>;
  sinon?: string;
  si_non_eligible?: string;
  si_surbookee?: string;
  parametres?: Record<string, unknown>;
  aucun_creneau?: string;
  /** Mention légale affichée sous le bouton d'envoi (D51). */
  mention_cta?: { texte: string; lien: { libelle: string; url: string } };
};

export type Sortie = { code: string } & Record<string, unknown>;

export type Arbre = {
  start: string;
  noeuds: Record<string, Noeud>;
  sorties: Record<string, Sortie>;
};

export type RdvExistant = { telephone: string; email: string };

export type ContexteMachine = {
  rdvExistants?: RdvExistant[];
  /** Date de référence de l'agenda simulé (injectable pour les tests). */
  aujourdhui?: Date;
  agences?: Agence[];
};

export type OptionsMachine = {
  prefill?: Record<string, string>;
  projet?: Projet;
  contexte?: ContexteMachine;
};

export type Position =
  | { type: "noeud"; id: string; noeud: Noeud }
  | { type: "sortie"; code: string; sortie: Sortie };

export type EtatMachine = {
  reponses: Record<string, ValeurReponse>;
  nonEligible: string[];
  historique: string[];
  notesTechnicien: string[];
};

export type Machine = {
  courant: () => Position;
  repondre: (valeur: ValeurReponse) => void;
  avancer: () => void;
  retour: () => void;
  etat: () => EtatMachine;
  /** Options à afficher pour un nœud, projet pris en compte (D49). */
  optionsDe: (noeud: Noeud) => OptionNoeud[];
};

const AGENCES = agencesJson.agences as unknown as Agence[];

// ------------------------------------------------------------------ outils

/** Un téléphone se compare sur ses chiffres seuls : « 06 00 00 00 09 » ≡ « 0600000009 ». */
function normaliserTelephone(valeur: string): string {
  return valeur.replace(/\D/g, "");
}

function normaliserEmail(valeur: string): string {
  return valeur.trim().toLowerCase();
}

function estSortie(cible: string): boolean {
  return cible.startsWith("@");
}

export function creerMachine(
  arbre: Arbre,
  options: OptionsMachine = {},
): Machine {
  const herite: Record<string, string> = { ...(options.prefill ?? {}) };
  const contexte = options.contexte ?? {};
  const agences = contexte.agences ?? AGENCES;
  const aujourdhui = contexte.aujourdhui ?? new Date();

  const reponses: Record<string, ValeurReponse> = {};
  const nonEligible: string[] = [];
  const historique: string[] = [];
  const notesTechnicien: string[] = [];

  let position: Position;

  // ------------------------------------------------- résolution de valeurs

  /**
   * Valeur d'une clé du simulateur : héritée si le prefill la porte, sinon
   * lue sur le nœud qui la collecte (ou dans un champ de formulaire).
   */
  /**
   * Une valeur collectée dans le parcours l'emporte sur celle héritée du
   * simulateur : l'adresse saisie en B14 est plus précise que le code postal
   * de l'estimation, et c'est elle qui doit router l'agence.
   */
  function valeurCle(cle: string): string | undefined {
    for (const [id, noeud] of Object.entries(arbre.noeuds)) {
      if (noeud.prefill === cle) {
        const valeur = reponses[id];
        if (typeof valeur === "string") return valeur;
      }
      for (const champ of noeud.champs ?? []) {
        if (champ.prefill === cle) {
          const valeur = reponses[id];
          if (valeur && typeof valeur === "object" && !Array.isArray(valeur)) {
            const saisie = valeur[champ.id];
            if (saisie) return saisie;
          }
        }
      }
    }

    return herite[cle];
  }

  function projetCourant(): string | undefined {
    return options.projet ?? valeurCle("projet");
  }

  // ------------------------------------------------------------ règles P(e)

  function evaluerPe(noeud: Noeud, valeur: string | undefined) {
    const pe = noeud.pe;
    if (!pe || valeur === undefined) return;

    const projet = projetCourant();
    if (pe.condition?.projet && (!projet || !pe.condition.projet.includes(projet))) {
      return;
    }

    const declenche = pe.op === "eq" ? valeur === pe.valeur : false;
    if (declenche && !nonEligible.includes(pe.regle)) {
      nonEligible.push(pe.regle);
    }
  }

  // ------------------------------------------------------------ ciblage

  function cibleOption(option: OptionNoeud, noeud: Noeud): string {
    // `cible_si` détourne la cible quand une réponse déjà connue le justifie
    // (B10 : toiture rénovée mais maison d'avant 1997 → on vérifie l'amiante).
    if (option.cible_si) {
      const { cible, ...conditions } = option.cible_si;
      const satisfaite = Object.entries(conditions).every(
        ([cle, attendue]) => valeurCle(cle) === attendue,
      );
      if (satisfaite && cible) return cible;
    }

    const cible = option.cible ?? noeud.next;
    if (!cible) {
      throw new Error(`Option « ${option.valeur} » sans cible ni next`);
    }
    return cible;
  }

  /** Options réellement posées : le solaire seul a parfois un jeu restreint. */
  function optionsDe(noeud: Noeud): OptionNoeud[] {
    const brutes =
      noeud.options_solaire && projetCourant() === "solaire"
        ? noeud.options_solaire
        : (noeud.options ?? []);

    // D57 : « Découvrir la pompe à chaleur » n'a pas de sens si le projet en
    // comporte déjà une.
    const projet = projetCourant();
    return brutes.filter(
      (option) =>
        !option.condition?.projet ||
        (projet !== undefined && option.condition.projet.includes(projet)),
    );
  }

  function optionDe(noeud: Noeud, valeur: string): OptionNoeud | undefined {
    return optionsDe(noeud).find((o) => o.valeur === valeur);
  }

  // ------------------------------------------------------------ garde B14

  function appliquerGarde(noeud: Noeud, valeur: ValeurReponse): string {
    const guard = noeud.guard;
    const suite = noeud.next;
    if (!guard || !suite) {
      if (!suite) throw new Error("Formulaire sans next");
      return suite;
    }

    const champs =
      valeur && typeof valeur === "object" && !Array.isArray(valeur)
        ? valeur
        : {};
    const cp = champs.cp ?? valeurCle("cp") ?? "";

    if (guard.exception_test && cp === guard.exception_test) return suite;

    const horsZone = (guard.hors_zone_prefixes ?? []).some((p) =>
      cp.startsWith(p),
    );
    if (horsZone) return guard.cible;

    const routage = trouverAgence(cp, agences, guard.rayon_km);
    return routage ? suite : guard.cible;
  }

  // ------------------------------------------------------- nœuds « regle »

  function executerRegle(id: string, noeud: Noeud): string {
    switch (noeud.regle) {
      case "prospect_existant": {
        const coordonnees = coordonneesSaisies();

        for (const cas of noeud.cas ?? []) {
          if (cas.test === "rdv_localstorage_meme_tel_ou_email") {
            const doublon = (contexte.rdvExistants ?? []).some(
              (rdv) =>
                (coordonnees.telephone !== "" &&
                  normaliserTelephone(rdv.telephone) ===
                    coordonnees.telephone) ||
                (coordonnees.email !== "" &&
                  normaliserEmail(rdv.email) === coordonnees.email),
            );
            if (doublon) return cas.cible;
          }

          if (
            cas.test === "telephone_egal" &&
            cas.valeur !== undefined &&
            normaliserTelephone(cas.valeur) === coordonnees.telephone
          ) {
            return cas.cible;
          }
        }

        return exiger(noeud.sinon, id);
      }

      case "eligibilite":
        return nonEligible.length > 0
          ? exiger(noeud.si_non_eligible, id)
          : exiger(noeud.sinon, id);

      case "disponibilite_agence": {
        const cp = valeurCle("cp") ?? CP_TEST_SURBOOKEE;
        const routage = trouverAgence(cp, agences);
        if (!routage) return exiger(noeud.sinon, id);

        const parametres = (noeud.parametres ?? {}) as {
          fenetre_jours?: number;
          seuil_creneaux_libres?: number;
        };
        const agence = routage.agence;

        const creneaux = genererCreneaux(agence, {
          seed: cp,
          aujourdhui,
          horizonJours: agence.horizon_jours,
          delaiMinJoursOuvres: agence.delai_min_jours_ouvres,
          dureeMin: agence.duree_visite_min,
        });

        const surbookee = estSurbookee(creneaux, {
          fenetreJours:
            parametres.fenetre_jours ?? agence.fenetre_surbooking_jours,
          seuil: parametres.seuil_creneaux_libres ?? agence.seuil_surbooking,
          aujourdhui,
        });

        return surbookee
          ? exiger(noeud.si_surbookee, id)
          : exiger(noeud.sinon, id);
      }

      default:
        throw new Error(`Règle inconnue sur ${id} : ${noeud.regle}`);
    }
  }

  /** Coordonnées saisies, quel que soit le nœud de formulaire qui les porte. */
  function coordonneesSaisies(): { telephone: string; email: string } {
    let telephone = "";
    let email = "";

    for (const valeur of Object.values(reponses)) {
      if (!valeur || typeof valeur !== "object" || Array.isArray(valeur)) {
        continue;
      }
      if (valeur.telephone) telephone = normaliserTelephone(valeur.telephone);
      if (valeur.email) email = normaliserEmail(valeur.email);
    }

    return { telephone, email };
  }

  function exiger(cible: string | null | undefined, id: string): string {
    if (!cible) throw new Error(`Nœud ${id} sans cible de sortie`);
    return cible;
  }

  // --------------------------------------------------- déplacement

  function noeudDe(id: string): Noeud {
    const noeud = arbre.noeuds[id];
    if (!noeud) throw new Error(`Nœud inconnu : ${id}`);
    return noeud;
  }

  function sortieDe(cible: string): Position {
    const sortie = arbre.sorties[cible];
    if (!sortie) throw new Error(`Sortie inconnue : ${cible}`);
    return { type: "sortie", code: sortie.code, sortie };
  }

  function noter(note: string) {
    if (!notesTechnicien.includes(note)) notesTechnicien.push(note);
  }

  /**
   * Le prospect a corrigé une réponse du simulateur : le technicien doit le
   * savoir avant de se déplacer (le code postal du projet, notamment).
   */
  function noterEcartsPrefill(noeud: Noeud, valeur: ValeurReponse) {
    if (!valeur || typeof valeur !== "object" || Array.isArray(valeur)) return;

    for (const champ of noeud.champs ?? []) {
      if (!champ.prefill || !champ.note_si_different) continue;

      const avant = herite[champ.prefill];
      const apres = valeur[champ.id];
      if (!avant || !apres || avant === apres) continue;

      noter(
        champ.note_si_different
          .replaceAll("{avant}", avant)
          .replaceAll("{apres}", apres),
      );
    }
  }

  function noterOption(option: OptionNoeud | undefined) {
    if (option?.note_technicien) noter(option.note_technicien);
    // D57 : réserver malgré une règle de non-rentabilité se dit au technicien.
    if (option?.note_regles) {
      for (const regle of nonEligible) noter(`regle:${regle}`);
    }
  }

  /**
   * Se place sur `cible` en traversant tout ce qui n'a pas à être demandé :
   * nœuds filtrés par projet, nœuds déjà renseignés par le simulateur.
   */
  function allerVers(cible: string) {
    let courantId = cible;

    // Garde-fou : un arbre mal câblé ne doit pas boucler indéfiniment.
    for (let pas = 0; pas <= Object.keys(arbre.noeuds).length; pas++) {
      if (estSortie(courantId)) {
        position = sortieDe(courantId);
        return;
      }

      const noeud = noeudDe(courantId);

      // (2) le nœud ne concerne pas ce projet
      const projet = projetCourant();
      if (
        noeud.condition?.projet &&
        (!projet || !noeud.condition.projet.includes(projet))
      ) {
        courantId = exiger(noeud.next_sinon ?? noeud.next, courantId);
        continue;
      }

      // (1) valeur déjà connue : on saute en évaluant la règle P(e)
      const valeurHeritee = noeud.prefill ? valeurCle(noeud.prefill) : undefined;
      if (noeud.prefill && valeurHeritee !== undefined) {
        reponses[courantId] = valeurHeritee;
        evaluerPe(noeud, valeurHeritee);

        const option = optionDe(noeud, valeurHeritee);
        noterOption(option);
        courantId = noeud.next ?? cibleOption(option ?? { valeur: valeurHeritee }, noeud);
        continue;
      }

      // Réponse déductible d'une autre clé (B10p : chauffage électrique)
      const deduite = valeurDeduite(noeud);
      if (deduite !== undefined) {
        reponses[courantId] = deduite;
        const option = optionDe(noeud, deduite);
        noterOption(option);
        courantId = option
          ? cibleOption(option, noeud)
          : exiger(noeud.next, courantId);
        continue;
      }

      position = { type: "noeud", id: courantId, noeud };
      return;
    }

    throw new Error(`Boucle détectée dans l'arbre à partir de ${cible}`);
  }

  /** `prefill_si` : mappe la valeur d'une clé du simulateur sur une option. */
  function valeurDeduite(noeud: Noeud): string | undefined {
    for (const [cle, correspondances] of Object.entries(
      noeud.prefill_si ?? {},
    )) {
      const valeur = valeurCle(cle);
      if (valeur !== undefined && correspondances[valeur] !== undefined) {
        return correspondances[valeur];
      }
    }
    return undefined;
  }

  // ------------------------------------------------------------ API

  function courant(): Position {
    return position;
  }

  function repondre(valeur: ValeurReponse) {
    if (position.type !== "noeud") {
      throw new Error("Le parcours est terminé : plus rien à répondre");
    }

    const { id, noeud } = position;
    reponses[id] = valeur;
    historique.push(id);

    switch (noeud.type) {
      // D57 : un écran d'orientation se répond comme un choix — c'en est un.
      case "orientation":
      case "choix": {
        if (typeof valeur !== "string") {
          throw new Error(`${id} attend une valeur unique`);
        }
        const option = optionDe(noeud, valeur);
        if (!option) throw new Error(`Option inconnue sur ${id} : ${valeur}`);

        evaluerPe(noeud, valeur);
        noterOption(option);
        allerVers(cibleOption(option, noeud));
        return;
      }

      case "multi": {
        allerVers(exiger(noeud.next, id));
        return;
      }

      case "form": {
        noterEcartsPrefill(noeud, valeur);
        allerVers(appliquerGarde(noeud, valeur));
        return;
      }

      case "otp": {
        allerVers(exiger(noeud.next, id));
        return;
      }

      default:
        // info, regle, calendrier : ils avancent, ils ne « répondent » pas.
        allerVers(exiger(noeud.next, id));
    }
  }

  function avancer() {
    if (position.type !== "noeud") return;

    const { id, noeud } = position;

    if (noeud.type === "regle") {
      historique.push(id);
      allerVers(executerRegle(id, noeud));
      return;
    }

    if (noeud.next === null) return; // B22 : fin de parcours

    historique.push(id);
    allerVers(exiger(noeud.next, id));
  }

  function retour() {
    const precedent = historique.pop();
    if (!precedent) return;

    delete reponses[precedent];
    position = { type: "noeud", id: precedent, noeud: noeudDe(precedent) };
  }

  function etat(): EtatMachine {
    return {
      reponses: { ...reponses },
      nonEligible: [...nonEligible],
      historique: [...historique],
      notesTechnicien: [...notesTechnicien],
    };
  }

  allerVers(arbre.start);

  return { courant, repondre, avancer, retour, etat, optionsDe };
}
