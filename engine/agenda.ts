/**
 * Agenda simulé — routage d'agence, créneaux déterministes et export ICS.
 *
 * Tout est calculé localement : la disponibilité vient d'un PRNG seedé par le
 * code postal, donc identique d'un rechargement à l'autre (une démo doit
 * montrer deux fois le même calendrier). Rien n'est un agenda réel : l'écran
 * porte le badge « agenda simulé » (D31).
 */
import zones from "@/data/zones.json";

// ------------------------------------------------------------------ types

export type Agence = {
  id: string;
  nom: string;
  ville: string;
  dept: string;
  lat: number | null;
  lon: number | null;
  depts: string[];
  jours_travailles: number[];
  creneaux_debut: string[];
  duree_visite_min: number;
  horizon_jours: number;
  /** D58 : horizon élargi quand le prospect demande des créneaux plus lointains. */
  horizon_etendu_jours: number;
  delai_min_jours_ouvres: number;
  seuil_surbooking: number;
  fenetre_surbooking_jours: number;
  self_booking_actif: boolean;
  surbookee_test?: boolean;
  telephone?: string;
};

export type Periode = "matin" | "apres_midi";

export type Creneau = {
  debut: Date;
  fin: Date;
  dureeMin: number;
  periode: Periode;
  agenceId: string;
};

export type ParametresCreneaux = {
  /** Graine du PRNG : le code postal, pour un calendrier stable par secteur. */
  seed: string;
  aujourdhui: Date;
  horizonJours: number;
  delaiMinJoursOuvres: number;
  dureeMin: number;
};

const MS_PAR_JOUR = 86_400_000;
const FUSEAU = "Europe/Paris";

// ------------------------------------------------- fuseau horaire Europe/Paris

const FORMAT_PARIS = new Intl.DateTimeFormat("en-GB", {
  timeZone: FUSEAU,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

type PartiesDate = {
  annee: number;
  mois: number;
  jour: number;
  heure: number;
  minute: number;
  seconde: number;
};

/** Décompose un instant en heure murale de Paris. */
export function partiesParis(instant: Date): PartiesDate {
  const parts = new Map(
    FORMAT_PARIS.formatToParts(instant)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, Number(p.value)]),
  );

  return {
    annee: parts.get("year")!,
    mois: parts.get("month")!,
    jour: parts.get("day")!,
    // Intl rend 24 pour minuit dans certains environnements.
    heure: parts.get("hour")! % 24,
    minute: parts.get("minute")!,
    seconde: parts.get("second")!,
  };
}

function decalageParisMs(instant: Date): number {
  const p = partiesParis(instant);
  const commeUtc = Date.UTC(
    p.annee,
    p.mois - 1,
    p.jour,
    p.heure,
    p.minute,
    p.seconde,
  );
  return commeUtc - instant.getTime();
}

/**
 * Construit l'instant correspondant à une heure murale de Paris.
 * Deux passes : la première estime le décalage, la seconde le corrige si la
 * date tombe autour d'un changement d'heure.
 */
export function instantParis(
  annee: number,
  mois: number,
  jour: number,
  heure: number,
  minute: number,
): Date {
  const naif = Date.UTC(annee, mois - 1, jour, heure, minute);
  const premier = new Date(naif - decalageParisMs(new Date(naif)));
  const decalage = decalageParisMs(premier);
  const second = new Date(naif - decalage);

  return decalageParisMs(second) === decalage ? second : premier;
}

function formaterHeureParis(instant: Date): string {
  const p = partiesParis(instant);
  return `${String(p.heure).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

/** Horodatage ICS en heure locale de Paris : 20260916T083000. */
function horodatageParis(instant: Date): string {
  const p = partiesParis(instant);
  const d = (n: number) => String(n).padStart(2, "0");
  return `${p.annee}${d(p.mois)}${d(p.jour)}T${d(p.heure)}${d(p.minute)}${d(p.seconde)}`;
}

// ------------------------------------------------------------------ PRNG

/** Hachage de chaîne (cyrb53 simplifié) : même graine → même suite. */
function graine(texte: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 : générateur déterministe, suffisant pour une démo. */
function prng(seed: number): () => number {
  let etat = seed >>> 0;
  return () => {
    etat = (etat + 0x6d2b79f5) >>> 0;
    let t = etat;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------------------------------------------- routage d'agence

type Zone = {
  prefecture_lat?: number;
  prefecture_lon?: number;
};

const ZONES = zones as unknown as Record<string, Zone>;

/** Code département depuis un code postal (Corse traitée par ses arrondissements). */
export function deptDepuisCp(cp: string): string {
  if (cp.startsWith("20")) return Number(cp) < 20200 ? "2A" : "2B";
  return cp.slice(0, 2);
}

/** Distance orthodromique en kilomètres. */
export function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

export const CP_TEST_SURBOOKEE = "99999";
export const RAYON_MAX_KM = 60;

/**
 * Agence la plus proche de la préfecture du département du code postal,
 * dans un rayon de 60 km. Le code postal de test 99999 route sur l'agence
 * fictive TEST (règle D30).
 */
export function trouverAgence(
  cp: string,
  agences: Agence[],
  rayonKm: number = RAYON_MAX_KM,
): { agence: Agence; distanceKm: number } | null {
  if (cp === CP_TEST_SURBOOKEE) {
    const test = agences.find((a) => a.id === "TEST");
    return test ? { agence: test, distanceKm: 0 } : null;
  }

  const zone = ZONES[deptDepuisCp(cp)];
  if (!zone?.prefecture_lat || !zone.prefecture_lon) return null;

  let meilleure: { agence: Agence; distanceKm: number } | null = null;

  for (const agence of agences) {
    if (agence.lat === null || agence.lon === null) continue;

    const d = distanceKm(
      zone.prefecture_lat,
      zone.prefecture_lon,
      agence.lat,
      agence.lon,
    );

    if (d <= rayonKm && (meilleure === null || d < meilleure.distanceKm)) {
      meilleure = { agence, distanceKm: Math.round(d * 10) / 10 };
    }
  }

  return meilleure;
}

// ------------------------------------------------------------- créneaux

/** Jour ISO (1 = lundi … 7 = dimanche) de l'heure murale parisienne. */
function jourIso(instant: Date): number {
  const p = partiesParis(instant);
  const jour = new Date(Date.UTC(p.annee, p.mois - 1, p.jour)).getUTCDay();
  return jour === 0 ? 7 : jour;
}

/** Part d'indisponibilité par défaut : une agence réelle n'est jamais vide. */
const TAUX_INDISPONIBILITE = 0.45;

/**
 * Créneaux **proposables** (les indisponibles ne sont pas rendus) :
 * jours travaillés de l'agence, à partir de J+1 ouvré, sur l'horizon demandé,
 * aux heures de début de l'agence, visites de `dureeMin`.
 *
 * Une agence marquée `surbookee_test` est bridée à `seuil_surbooking - 1`
 * créneaux libres dans sa fenêtre de surbooking : la règle D30 est ainsi
 * démontrable de façon déterministe, sans dépendre du tirage.
 */
export function genererCreneaux(
  agence: Agence,
  parametres: ParametresCreneaux,
): Creneau[] {
  const { seed, aujourdhui, horizonJours, delaiMinJoursOuvres, dureeMin } =
    parametres;

  const tirage = prng(graine(`${seed}|${agence.id}`));
  const debutFenetre = aujourdhui.getTime() + delaiMinJoursOuvres * MS_PAR_JOUR;
  const finFenetre = aujourdhui.getTime() + horizonJours * MS_PAR_JOUR;

  const base = partiesParis(aujourdhui);
  const creneaux: Creneau[] = [];

  for (let decalage = 0; decalage <= horizonJours; decalage++) {
    // Arithmétique calendaire en UTC, puis reconstruction de l'heure murale.
    const jourUtc = new Date(
      Date.UTC(base.annee, base.mois - 1, base.jour + decalage),
    );
    const annee = jourUtc.getUTCFullYear();
    const mois = jourUtc.getUTCMonth() + 1;
    const jour = jourUtc.getUTCDate();

    for (const heureDebut of agence.creneaux_debut) {
      const [h, m] = heureDebut.split(":").map(Number);
      const debut = instantParis(annee, mois, jour, h!, m!);

      // Le tirage est consommé pour chaque créneau théorique : la suite
      // reste stable même quand les bornes en écartent certains.
      const libre = tirage() >= TAUX_INDISPONIBILITE;

      if (!agence.jours_travailles.includes(jourIso(debut))) continue;
      if (debut.getTime() < debutFenetre) continue;
      if (debut.getTime() > finFenetre) continue;
      if (!libre) continue;

      creneaux.push({
        debut,
        fin: new Date(debut.getTime() + dureeMin * 60_000),
        dureeMin,
        periode: partiesParis(debut).heure < 12 ? "matin" : "apres_midi",
        agenceId: agence.id,
      });
    }
  }

  creneaux.sort((a, b) => a.debut.getTime() - b.debut.getTime());

  if (agence.surbookee_test) {
    const finSurbooking =
      aujourdhui.getTime() + agence.fenetre_surbooking_jours * MS_PAR_JOUR;
    const maxLibres = Math.max(agence.seuil_surbooking - 1, 0);

    let gardes = 0;
    return creneaux.filter((c) => {
      if (c.debut.getTime() > finSurbooking) return true;
      gardes += 1;
      return gardes <= maxLibres;
    });
  }

  return creneaux;
}

export type ParametresSurbooking = {
  fenetreJours: number;
  seuil: number;
  aujourdhui: Date;
};

/**
 * Règle D30 : moins de `seuil` créneaux libres sur la fenêtre glissante
 * ⇒ écran « forte demande » : seuls les créneaux lointains restent (D57/D58).
 */
export function estSurbookee(
  creneaux: Creneau[],
  { fenetreJours, seuil, aujourdhui }: ParametresSurbooking,
): boolean {
  const fin = aujourdhui.getTime() + fenetreJours * MS_PAR_JOUR;
  const libres = creneaux.filter(
    (c) => c.debut.getTime() >= aujourdhui.getTime() && c.debut.getTime() <= fin,
  );

  return libres.length < seuil;
}

// ------------------------------------------------------------------ ICS

export type RdvIcs = {
  debut: Date;
  dureeMin: number;
  titre: string;
  lieu: string;
  description: string;
  uid: string;
};

/** Échappement RFC 5545 : `\` `;` `,` et sauts de ligne. */
function echapper(texte: string): string {
  return texte
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Plie une ligne à 73 octets : avec le CRLF ajouté ensuite, aucune ligne
 * n'excède les 75 octets du RFC. Les suites commencent par une espace.
 */
function plier(ligne: string): string[] {
  const LARGEUR = 73;
  if (ligne.length <= LARGEUR) return [ligne];

  const morceaux = [ligne.slice(0, LARGEUR)];
  let reste = ligne.slice(LARGEUR);

  while (reste.length > LARGEUR - 1) {
    morceaux.push(` ${reste.slice(0, LARGEUR - 1)}`);
    reste = reste.slice(LARGEUR - 1);
  }
  if (reste.length > 0) morceaux.push(` ${reste}`);

  return morceaux;
}

/**
 * VCALENDAR d'un créneau, en heure locale Europe/Paris avec sa VTIMEZONE :
 * l'événement reste juste quel que soit le fuseau du téléphone qui l'ouvre.
 */
export function genererIcs(rdv: RdvIcs): string {
  const fin = new Date(rdv.debut.getTime() + rdv.dureeMin * 60_000);

  const lignes = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HomeServe POC//Mon projet energie//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VTIMEZONE",
    `TZID:${FUSEAU}`,
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:+0100",
    "TZOFFSETTO:+0200",
    "TZNAME:CEST",
    "DTSTART:19700329T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0200",
    "TZOFFSETTO:+0100",
    "TZNAME:CET",
    "DTSTART:19701025T030000",
    "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
    "END:STANDARD",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `UID:${rdv.uid}`,
    `DTSTAMP:${horodatageParis(rdv.debut)}`,
    `DTSTART;TZID=${FUSEAU}:${horodatageParis(rdv.debut)}`,
    `DTEND;TZID=${FUSEAU}:${horodatageParis(fin)}`,
    `SUMMARY:${echapper(rdv.titre)}`,
    `LOCATION:${echapper(rdv.lieu)}`,
    `DESCRIPTION:${echapper(rdv.description)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lignes.flatMap(plier).join("\r\n");
}

export { formaterHeureParis };
