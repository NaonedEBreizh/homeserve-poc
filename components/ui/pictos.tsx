/**
 * Pictogrammes et illustrations, dessinés ici en SVG inline (D46-A).
 *
 * Deux règles : aucune requête réseau — donc pas de bibliothèque d'icônes —
 * et aucune couleur en dur. Le trait prend `currentColor`, le remplissage
 * d'accent prend `--color-corail-600` : les pictogrammes sont bicolores
 * noir/corail sans jamais sortir des tokens de globals.css.
 */
type PropsPicto = { className?: string; taille?: number };

/** Le trait ne suit pas la couleur du texte : il reste noir sur une carte
 *  sélectionnée, dont le libellé passe en orange. */
const TRAIT = "var(--color-neutre-700)";

function Svg({
  children,
  className = "",
  taille = 44,
  strokeWidth = 1.75,
}: PropsPicto & { children: React.ReactNode; strokeWidth?: number }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 44 44"
      fill="none"
      stroke={TRAIT}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

const ACCENT = "var(--color-corail-600)";

/** Mot-symbole : toit + panneau, trait corail. Aucun logo officiel. */
export function PictoMaison({ className = "", taille = 28 }: PropsPicto) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 28 28"
      fill="none"
      stroke={ACCENT}
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M4 13.2 14 5.5l10 7.7" />
      <path d="M6.4 12.4V22h15.2v-9.6" />
      <path d="M10.2 15.4h7.6l1 4.2h-9.6z" fill={ACCENT} stroke="none" />
    </svg>
  );
}

/* ------------------------------------------------ pictogrammes d'options */

/**
 * Grille de 44 : les pictogrammes d'options sont dessinés à leur taille
 * d'affichage, pas agrandis depuis 24. Trois couleurs, jamais plus — la forme
 * pleine (`--picto-fond`, corail-100 par défaut), le trait noir de 1,75 px et
 * un accent corail-600 qui pointe ce qui distingue l'option de sa voisine.
 *
 * `--picto-fond` passe au blanc sur une carte sélectionnée : le fond de carte
 * est alors orange-100, trop proche du corail-100 pour que la forme se lise.
 */
const FOND = "var(--picto-fond, var(--color-corail-100))";

const PICTOS: Record<string, (p: PropsPicto) => React.ReactElement> = {
  // --- projet -------------------------------------------------------------
  solaire: (p) => (
    <Svg {...p}>
      <path d="M5 25 22 10l17 15z" fill={FOND} />
      <path d="M9 25v13h26V25" />
      <path d="M13.5 23 19 18h9.5L23 23z" fill={ACCENT} stroke="none" />
      <path d="M20 38v-7h4v7" />
    </Svg>
  ),
  pac: PictoPac,
  pompe_a_chaleur: PictoPac,
  pompe_a_chaleur_equipement: PictoPac,
  les_deux: (p) => (
    <Svg {...p}>
      <path d="M4 19 15 9l11 10z" fill={FOND} />
      <path d="M7 19v11h16V19" />
      <path d="M10 17.5 14 14h5l-4 3.5z" fill={ACCENT} stroke="none" />
      <rect x="25" y="24" width="15" height="12" rx="2.5" fill={FOND} />
      <circle cx="32.5" cy="30" r="3.6" fill={ACCENT} stroke="none" />
      <path d="M28 39h9" />
    </Svg>
  ),

  // --- chauffage ----------------------------------------------------------
  radiateurs_electriques: (p) => (
    <Svg {...p}>
      <rect x="6" y="11" width="22" height="21" rx="3" fill={FOND} />
      <path d="M12 14v15M17 14v15M22 14v15" />
      <path d="M10 36h14" />
      <path d="M33 13c2.5 2.5 2.5 5 0 7.5s-2.5 5 0 7.5" stroke={ACCENT} />
      <path d="M39 15c2 2 2 4 0 6s-2 4 0 6" stroke={ACCENT} />
    </Svg>
  ),
  gaz_fioul_bois: (p) => (
    <Svg {...p}>
      {/* Le décroché à gauche fait la flamme : sans lui, c'est une goutte. */}
      <path d="M23 4c6 7.5 11 11.5 11 18a12 12 0 0 1-24 0c0-3.4 1.6-6.3 3.9-8.4.3 2.3 1.4 4 3 5-1.6-5.4 1.2-10.6 6.1-14.6z" fill={FOND} />
      <path d="M22.5 23c2.7 3.2 4 4.8 4 6.7a4 4 0 0 1-8 0c0-1.9 1.3-3.5 4-6.7z" fill={ACCENT} stroke="none" />
    </Svg>
  ),
  gaz: (p) => (
    <Svg {...p}>
      <path d="M23 4c5 6.3 9.2 9.6 9.2 15a10 10 0 0 1-20 0c0-2.8 1.3-5.3 3.3-7 .2 1.9 1.1 3.3 2.4 4.2-1.3-4.5 1-8.9 5.1-12.2z" fill={FOND} />
      <path d="M22.5 20c2.2 2.6 3.3 3.9 3.3 5.4a3.3 3.3 0 1 1-6.6 0c0-1.5 1.1-2.8 3.3-5.4z" fill={ACCENT} stroke="none" />
      <path d="M10 33h24M14 38h16" />
    </Svg>
  ),
  fioul: (p) => (
    <Svg {...p}>
      <rect x="7" y="14" width="26" height="20" rx="4" fill={FOND} />
      <path d="M33 20h5v8h-5" />
      <path d="M12 38h16" />
      <path d="M20 18c2.2 3 3.3 4.2 3.3 5.9a3.3 3.3 0 1 1-6.6 0c0-1.7 1.1-2.9 3.3-5.9z" fill={ACCENT} stroke="none" />
    </Svg>
  ),
  bois: (p) => (
    <Svg {...p}>
      <ellipse cx="14" cy="17" rx="6" ry="7.5" fill={FOND} />
      <path d="M14 9.5h14a7.5 7.5 0 0 1 0 15H14" fill={FOND} />
      <ellipse cx="14" cy="17" rx="2.4" ry="3" fill={ACCENT} stroke="none" />
      <ellipse cx="20" cy="32" rx="6" ry="7" fill={FOND} />
      <path d="M20 25h10a7 7 0 0 1 0 14H20" fill={FOND} />
      <ellipse cx="20" cy="32" rx="2.2" ry="2.8" fill={ACCENT} stroke="none" />
    </Svg>
  ),
  radiateurs_eau: (p) => (
    <Svg {...p}>
      <rect x="8" y="10" width="22" height="21" rx="3" fill={FOND} />
      <path d="M14 13v15M19 13v15M24 13v15" />
      <path d="M12 35h14" />
      <path d="M36 16c2.6 3.6 3.9 5.2 3.9 7.2a3.9 3.9 0 1 1-7.8 0c0-2 1.3-3.6 3.9-7.2z" fill={ACCENT} stroke="none" />
    </Svg>
  ),
  plancher_chauffant: (p) => (
    <Svg {...p}>
      <path d="M5 14h34v22H5z" fill={FOND} />
      <path d="M10 19h24M10 25h24M10 31h24" stroke={ACCENT} />
      <path d="M34 19v6M10 25v6" stroke={ACCENT} />
      <path d="M5 10h34" />
    </Svg>
  ),
  electrique: (p) => (
    <Svg {...p}>
      <rect x="8" y="11" width="22" height="20" rx="3" fill={FOND} />
      <path d="M14 14v14M19 14v14M24 14v14" />
      <path d="M12 35h14" />
      <path d="M36 13 32 22h5l-4 9" stroke={ACCENT} />
    </Svg>
  ),

  // --- équipements --------------------------------------------------------
  vehicule_electrique: (p) => (
    <Svg {...p}>
      <path d="M9 30v-6l4-8h16l5 8v6z" fill={FOND} />
      <path d="M15 23h13l-3-5h-8z" fill="white" />
      <circle cx="15.5" cy="32.5" r="3.5" fill="white" />
      <circle cx="29.5" cy="32.5" r="3.5" fill="white" />
      <path d="M9 25H6" />
      <rect x="1.5" y="21.5" width="4.5" height="7" rx="1.5" fill={ACCENT} stroke="none" />
      <path d="M38 20v10" stroke={ACCENT} />
      <path d="M34 25h4" stroke={ACCENT} />
    </Svg>
  ),
  borne_de_recharge: (p) => (
    <Svg {...p}>
      <rect x="9" y="5" width="16" height="28" rx="3.5" fill={FOND} />
      <rect x="12.5" y="9" width="9" height="7" rx="1.5" fill="white" />
      <path d="M18.5 20 15 27h4.5L16 33" stroke={ACCENT} />
      <path d="M7 37h20" />
      <path d="M25 14c7 0 10 4 10 9v8" />
      <rect x="31.5" y="31" width="7" height="6" rx="2" fill={ACCENT} stroke="none" />
    </Svg>
  ),
  piscine_ou_jacuzzi: (p) => (
    <Svg {...p}>
      <path d="M4 21h36v12a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" fill={FOND} />
      <path d="M8 27c3-2.4 5.5-2.4 8.5 0s5.5 2.4 8.5 0 5.5-2.4 8.5 0" stroke={ACCENT} />
      <path d="M8 33c3-2.4 5.5-2.4 8.5 0s5.5 2.4 8.5 0 5.5-2.4 8.5 0" />
      <path d="M15 21V8M22 21V8" />
      <path d="M15 12h7M15 16.5h7" />
    </Svg>
  ),
  climatisation: (p) => (
    <Svg {...p}>
      <rect x="5" y="8" width="34" height="14" rx="4" fill={FOND} />
      <path d="M10 18h24" />
      <circle cx="33" cy="12.5" r="1.7" fill={ACCENT} stroke="none" />
      <path d="M14 26c0 4-3 4.5-3 8.5" stroke={ACCENT} />
      <path d="M22 26c0 4-3 4.5-3 8.5" stroke={ACCENT} />
      <path d="M30 26c0 4-3 4.5-3 8.5" stroke={ACCENT} />
    </Svg>
  ),
  lave_vaisselle: (p) => (
    <Svg {...p}>
      <rect x="7" y="4" width="30" height="36" rx="3.5" fill={FOND} />
      <path d="M7 13h30" />
      <circle cx="32" cy="8.5" r="1.7" fill={ACCENT} stroke="none" />
      <circle cx="22" cy="26.5" r="8.5" fill="white" />
      <path d="M18.5 21.5v10M22 20.5v12M25.5 21.5v10" stroke={ACCENT} />
    </Svg>
  ),
  seche_linge: (p) => (
    <Svg {...p}>
      <rect x="7" y="4" width="30" height="36" rx="3.5" fill={FOND} />
      <path d="M7 13h30" />
      <circle cx="32" cy="8.5" r="1.7" fill={ACCENT} stroke="none" />
      <circle cx="22" cy="26.5" r="8.5" fill="white" />
      <path d="M22 21a5.5 5.5 0 1 1-4.8 2.8" stroke={ACCENT} />
      <path d="M22 18.5v5h-4.5" stroke={ACCENT} />
    </Svg>
  ),
  chauffe_eau_electrique: (p) => (
    <Svg {...p}>
      <rect x="12" y="4" width="20" height="28" rx="7" fill={FOND} />
      <path d="M17 36v-4M27 36v-4M14 39h16" />
      <path d="M22 13c2.8 4 4.2 5.7 4.2 7.9a4.2 4.2 0 1 1-8.4 0c0-2.2 1.4-3.9 4.2-7.9z" fill={ACCENT} stroke="none" />
    </Svg>
  ),
  chauffe_eau_thermodynamique: (p) => (
    <Svg {...p}>
      <rect x="12" y="12" width="20" height="20" rx="5" fill={FOND} />
      <path d="M17 36v-4M27 36v-4M14 39h16" />
      <path d="M22 18c2.5 3.6 3.8 5.1 3.8 7.1a3.8 3.8 0 1 1-7.6 0c0-2 1.3-3.5 3.8-7.1z" fill={ACCENT} stroke="none" />
      <circle cx="22" cy="8" r="5" fill="white" />
      <path d="M22 3v10M17 8h10" />
    </Svg>
  ),
  chauffage_secondaire: (p) => (
    <Svg {...p}>
      <rect x="6" y="14" width="26" height="14" rx="3" fill={FOND} />
      <path d="M12 17v8M19 17v8M26 17v8" />
      <path d="M10 32h18" />
      <path d="M32 28c4 1.5 5 4.5 4 8" stroke={ACCENT} />
      <circle cx="35" cy="38" r="2" fill={ACCENT} stroke="none" />
    </Svg>
  ),
  aucun: (p) => (
    <Svg {...p}>
      <circle cx="22" cy="22" r="16" fill={FOND} />
      <path d="M11 33 33 11" stroke={ACCENT} />
    </Svg>
  ),

  // --- logement et statut -------------------------------------------------
  maison: (p) => (
    <Svg {...p}>
      <path d="M5 21 22 7l17 14z" fill={FOND} />
      <path d="M9 21v17h26V21" fill={FOND} />
      <path d="M18 38V27h8v11" fill={ACCENT} stroke="none" />
    </Svg>
  ),
  appartement: (p) => (
    <Svg {...p}>
      <rect x="9" y="5" width="26" height="34" rx="2.5" fill={FOND} />
      <path d="M14 12h5M25 12h5M14 19h5M25 19h5M14 26h5M25 26h5" stroke={ACCENT} />
      <path d="M18 39v-6h8v6" />
    </Svg>
  ),
  pro: (p) => (
    <Svg {...p}>
      <path d="M8 18h28v21H8z" fill={FOND} />
      <path d="M4 18l4-9h28l4 9z" fill={ACCENT} stroke="none" />
      <path d="M17 39V27h10v12" />
    </Svg>
  ),
  proprietaire: (p) => (
    <Svg {...p}>
      <circle cx="16" cy="16" r="9.5" fill={FOND} />
      <circle cx="16" cy="16" r="3.2" fill="white" />
      <path d="M22.5 22.5 36.5 36.5" />
      <path d="M27.5 27.5l4.5-4.5M32 32l4.5-4.5" stroke={ACCENT} />
    </Svg>
  ),
  locataire: (p) => (
    <Svg {...p}>
      <rect x="9" y="5" width="24" height="30" rx="2.5" fill={FOND} />
      <path d="M14 13h14M14 19h14M14 25h8" />
      <path d="M14 32c4-4 7 2 11-2" stroke={ACCENT} />
      <path d="M33 35l5 4" stroke={ACCENT} />
    </Svg>
  ),
  principale: (p) => (
    <Svg {...p}>
      <path d="M5 21 22 7l17 14z" fill={FOND} />
      <path d="M9 21v17h26V21" fill={FOND} />
      <circle cx="22" cy="27" r="3" fill={ACCENT} stroke="none" />
      <path d="M16 38c0-4 2.7-6 6-6s6 2 6 6" fill={ACCENT} stroke="none" />
    </Svg>
  ),
  secondaire: (p) => (
    <Svg {...p}>
      <path d="M5 24 22 12l17 12z" fill={FOND} />
      <path d="M9 24v14h26V24" fill={FOND} />
      <path d="M18 38V29h8v9" />
      <circle cx="34" cy="8" r="4" fill={ACCENT} stroke="none" />
      <path d="M34 1v2M34 13v2M27 8h2M39 8h2M29 3l1.5 1.5M37.5 11.5 39 13" stroke={ACCENT} />
    </Svg>
  ),

  // --- toiture ------------------------------------------------------------
  tuile: (p) => (
    <Svg {...p}>
      <path d="M5 12h34v22H5z" fill={FOND} />
      <path d="M5 20c2.8-4 5.7-4 8.5 0s5.7 4 8.5 0 5.7-4 8.5 0 5.7 4 8.5 0" />
      <path d="M5 27c2.8-4 5.7-4 8.5 0s5.7 4 8.5 0 5.7-4 8.5 0 5.7 4 8.5 0" stroke={ACCENT} />
      <path d="M5 34c2.8-4 5.7-4 8.5 0s5.7 4 8.5 0 5.7-4 8.5 0 5.7 4 8.5 0" />
    </Svg>
  ),
  ardoise: (p) => (
    <Svg {...p}>
      <path d="M5 12h34v22H5z" fill={FOND} />
      <path d="M5 19h34M5 26h34" />
      <path d="M13 12v7M22 12v7M31 12v7M9 19v7M18 19v7M27 19v7M36 19v7M13 26v8M22 26v8M31 26v8" />
      <path d="M22 19h9v7h-9z" fill={ACCENT} stroke="none" />
    </Svg>
  ),
  bac_acier: (p) => (
    <Svg {...p}>
      <path d="M4 36h5V13h7v23h7V13h7v23h7V13h3v23" fill={FOND} />
      <circle cx="12.5" cy="18" r="1.7" fill={ACCENT} stroke="none" />
      <circle cx="26.5" cy="18" r="1.7" fill={ACCENT} stroke="none" />
      <circle cx="38" cy="18" r="1.7" fill={ACCENT} stroke="none" />
    </Svg>
  ),

  // --- année de construction et état -------------------------------------
  "<1997": (p) => (
    <Svg {...p}>
      <path d="M28 16V8h5v11" fill={ACCENT} stroke="none" />
      <path d="M5 22 22 8l17 14z" fill={FOND} />
      <path d="M9 22v16h26V22" fill={FOND} />
      <path d="M18 38V29h8v9" />
    </Svg>
  ),
  "1997-2010": (p) => (
    <Svg {...p}>
      <path d="M5 22 22 8l17 14z" fill={FOND} />
      <path d="M9 22v16h26V22" fill={FOND} />
      <path d="M18 38V29h8v9" />
      <rect x="13" y="26" width="6" height="6" rx="1" fill={ACCENT} stroke="none" />
    </Svg>
  ),
  ">2010": PictoMaisonRecente,
  ">1997": PictoMaisonRecente,
  en_construction: (p) => (
    <Svg {...p}>
      <path d="M8 38V16h22v22" fill={FOND} />
      <path d="M4 38h36" />
      <path d="M8 24h22M8 31h22" />
      <path d="M36 38V6h-14" stroke={ACCENT} />
      <path d="M30 6v6" stroke={ACCENT} />
      <rect x="27" y="12" width="6" height="5" rx="1" fill={ACCENT} stroke="none" />
    </Svg>
  ),
  renovee: (p) => (
    <Svg {...p}>
      <path d="M5 21 22 7l17 14z" fill={FOND} />
      <path d="M9 21v17h20V21" fill={FOND} />
      <path d="M15 38V28h8v10" />
      <rect x="31" y="20" width="9" height="7" rx="1.5" fill={ACCENT} stroke="none" />
      <path d="M35.5 27v11" stroke={ACCENT} />
    </Svg>
  ),
  origine: (p) => (
    <Svg {...p}>
      <path d="M28 16V8h5v11" fill={FOND} />
      <path d="M5 22 22 8l17 14z" fill={FOND} />
      <path d="M9 22v16h26V22" fill={FOND} />
      <path d="M18 38V29h8v9" fill={ACCENT} stroke="none" />
    </Svg>
  ),

  // --- occupation et foyer ------------------------------------------------
  moins_de_3_jours: PictoSemaine(2),
  "3_a_4_jours": PictoSemaine(3),
  "5_jours_et_plus": PictoSemaine(5),
  "1-2": PictoFoyer(2),
  "3-4": PictoFoyer(3),
  "5+": PictoFoyer(4),

  // --- revenus (barème MaPrimeRénov') ------------------------------------
  bleu: PictoRevenus(1),
  jaune: PictoRevenus(2),
  violet: PictoRevenus(3),
  rose: PictoRevenus(4),

  // --- réponses génériques ------------------------------------------------
  oui: (p) => (
    <Svg {...p}>
      <circle cx="22" cy="22" r="16" fill={FOND} />
      <path d="M14 22.5 19.5 28 30 16.5" stroke={ACCENT} />
    </Svg>
  ),
  non: (p) => (
    <Svg {...p}>
      <circle cx="22" cy="22" r="16" fill={FOND} />
      <path d="M16 16l12 12M28 16l-12 12" stroke={ACCENT} />
    </Svg>
  ),
  nsp: PictoInterrogation,
  autre: PictoInterrogation,
  depannage: (p) => (
    <Svg {...p}>
      <path d="M29 6a9 9 0 0 0-8.5 12L7 31.5a3.5 3.5 0 0 0 5 5L25.5 23A9 9 0 0 0 37 11l-5 5-4-4z" fill={FOND} />
      <circle cx="10.5" cy="33.5" r="1.6" fill={ACCENT} stroke="none" />
    </Svg>
  ),
  entretien: (p) => (
    <Svg {...p}>
      <path d="M22 5l3.5 3 4.5-1 1.5 4.4 4.4 1.5-1 4.5 3 3.5-3 3.5 1 4.5-4.4 1.5L30 34.5l-4.5-1-3.5 3-3.5-3-4.5 1-1.5-4.6L8.1 28.4l1-4.5-3-3.5 3-3.5-1-4.5 4.4-1.5L14 6.4l4.5 1z" fill={FOND} />
      <circle cx="22" cy="22" r="5.5" fill={ACCENT} stroke="none" />
    </Svg>
  ),
  nouveau_projet: (p) => (
    <Svg {...p}>
      <path d="M5 22 22 8l17 14z" fill={FOND} />
      <path d="M9 22v16h18V22" fill={FOND} />
      <circle cx="33" cy="31" r="7" fill={ACCENT} stroke="none" />
      <path d="M33 27.5v7M29.5 31h7" stroke="white" />
    </Svg>
  ),
  calendrier: (p) => (
    <Svg {...p}>
      <rect x="5" y="9" width="34" height="30" rx="4" fill={FOND} />
      <path d="M14 5v8M30 5v8M5 19h34" />
      <rect x="11" y="24" width="8" height="7" rx="1.5" fill={ACCENT} stroke="none" />
    </Svg>
  ),
};

/** Unité extérieure de pompe à chaleur : caisson, ventilateur, pieds. */
function PictoPac(p: PropsPicto) {
  return (
    <Svg {...p}>
      <rect x="6" y="9" width="32" height="23" rx="3.5" fill={FOND} />
      <circle cx="22" cy="20.5" r="7.5" fill="white" />
      <path
        d="M22 20.5V13a7.5 7.5 0 0 1 6.5 3.75zM22 20.5l6.5 3.75a7.5 7.5 0 0 1-6.5 3.75zM22 20.5l-6.5 3.75a7.5 7.5 0 0 1 0-7.5z"
        fill={ACCENT}
        stroke="none"
      />
      <path d="M11 36h22" />
    </Svg>
  );
}

/** Maison contemporaine : toit plat, pour les tranches récentes. */
function PictoMaisonRecente(p: PropsPicto) {
  return (
    <Svg {...p}>
      <path d="M6 16 22 9l16 7" fill="none" />
      <path d="M9 16v22h26V16" fill={FOND} />
      <rect x="13" y="21" width="9" height="7" rx="1" fill={ACCENT} stroke="none" />
      <path d="M26 38V28h6v10" />
    </Svg>
  );
}

/** Point d'interrogation : « autre » et « je ne sais pas ». */
function PictoInterrogation(p: PropsPicto) {
  return (
    <Svg {...p}>
      <circle cx="22" cy="22" r="16" fill={FOND} />
      <path d="M17.5 17.5a4.5 4.5 0 1 1 6.3 4.1V25" stroke={ACCENT} />
      <circle cx="22" cy="30" r="1.7" fill={ACCENT} stroke="none" />
    </Svg>
  );
}

/** Semaine de sept cases, dont `jours` occupées : la maison est habitée. */
function PictoSemaine(jours: number) {
  const cases = [0, 1, 2, 3, 4, 5, 6];
  return function Picto(p: PropsPicto) {
    return (
      <Svg {...p}>
        <rect x="4" y="9" width="36" height="30" rx="4" fill={FOND} />
        <path d="M13 5v8M31 5v8M4 19h36" />
        {cases.slice(0, 4).map((i) => (
          <rect
            key={`h${i}`}
            x={6.5 + i * 8}
            y={22}
            width="6"
            height="6"
            rx="1.2"
            fill={i < jours ? ACCENT : "white"}
            stroke="none"
          />
        ))}
        {cases.slice(4).map((i) => (
          <rect
            key={`b${i}`}
            x={6.5 + (i - 4) * 8}
            y={31}
            width="6"
            height="6"
            rx="1.2"
            fill={i < jours ? ACCENT : "white"}
            stroke="none"
          />
        ))}
      </Svg>
    );
  };
}

/** Silhouettes du foyer : une par personne, la dernière en accent. */
function PictoFoyer(personnes: number) {
  const positions = [10, 19, 28, 37].slice(0, personnes);
  return function Picto(p: PropsPicto) {
    return (
      <Svg {...p}>
        {positions.map((x, i) => {
          const teinte = i === positions.length - 1 ? ACCENT : FOND;
          return (
            <g key={x}>
              <circle cx={x} cy="15" r="4.5" fill={teinte} />
              <path d={`M${x - 7} 36c0-5 3-8 7-8s7 3 7 8z`} fill={teinte} />
            </g>
          );
        })}
      </Svg>
    );
  };
}

/** Barres croissantes : les quatre profils de revenus du barème 2026. */
function PictoRevenus(niveau: number) {
  const barres = [
    { x: 6, y: 28 },
    { x: 15, y: 22 },
    { x: 24, y: 16 },
    { x: 33, y: 10 },
  ];
  return function Picto(p: PropsPicto) {
    return (
      <Svg {...p}>
        <path d="M4 38h36" />
        {barres.map((b, i) => (
          <rect
            key={b.x}
            x={b.x}
            y={b.y}
            width="6"
            height={38 - b.y}
            rx="1.5"
            fill={i === niveau - 1 ? ACCENT : FOND}
            stroke={i < niveau ? undefined : "var(--color-neutre-300)"}
          />
        ))}
      </Svg>
    );
  };
}

/**
 * Pictogramme d'une option. Une clé sans métaphore — les tranches de facture
 * et de surface, purement numériques — n'en reçoit aucun : un rond générique
 * répété cinq fois n'apprendrait rien au lecteur.
 */
export function PictoOption({
  cle,
  className = "",
  taille = 44,
}: PropsPicto & { cle: string }) {
  const Composant = PICTOS[cle];
  if (!Composant) return null;

  return <Composant className={className} taille={taille} />;
}

/* -------------------------------------------------------- illustrations */

type PropsIllustration = { className?: string };

/**
 * Maison complète, toit couvert de panneaux. Le même dessin sert la carte
 * pack et l'onglet « Le pack proposé » du panneau d'aide : le lecteur doit
 * reconnaître d'un écran à l'autre ce dont on lui parle.
 */
export function IllustrationToit({ className = "" }: PropsIllustration) {
  return (
    <svg viewBox="0 0 120 72" className={className} aria-hidden="true">
      {/* Corps de la maison */}
      <path
        d="M26 38h56v24H26z"
        fill="white"
        stroke="var(--color-neutre-400)"
        strokeWidth="1.5"
      />
      {/* Toit */}
      <path
        d="M18 39 54 14l36 25z"
        fill="var(--color-neutre-100)"
        stroke="var(--color-neutre-400)"
        strokeWidth="1.5"
      />
      {/* Panneaux sur le pan de toit */}
      <g stroke="var(--color-canard-500)" strokeWidth="1.1" fill="var(--color-canard-300)">
        <path d="M38 34 50 25l9 6-12 9z" />
        <path d="M56 35 68 26l9 6-12 9z" />
      </g>
      {/* Porte et fenêtre */}
      <path d="M48 62V48h12v14" fill="var(--color-corail-100)" stroke="var(--color-corail-600)" strokeWidth="1.3" />
      <rect x="32" y="45" width="10" height="8" rx="1" fill="var(--color-neutre-100)" stroke="var(--color-neutre-400)" strokeWidth="1.2" />
      {/* Sol et soleil */}
      <path d="M10 62h100" stroke="var(--color-neutre-300)" strokeWidth="1.5" />
      <circle cx="102" cy="18" r="7" fill="var(--color-corail-100)" />
      <circle cx="102" cy="18" r="3.2" fill="var(--color-corail-600)" />
    </svg>
  );
}

/** Accueil : maison, panneaux et unité extérieure de pompe à chaleur. */
export function IllustrationAccueil({ className = "" }: PropsIllustration) {
  return (
    <svg viewBox="0 0 200 96" className={className} aria-hidden="true">
      <circle cx="172" cy="22" r="11" fill="var(--color-corail-100)" />
      <circle cx="172" cy="22" r="5" fill="var(--color-corail-600)" />

      <path d="M44 54h64v30H44z" fill="white" stroke="var(--color-neutre-400)" strokeWidth="1.6" />
      <path d="M34 55 76 24l42 31z" fill="var(--color-neutre-100)" stroke="var(--color-neutre-400)" strokeWidth="1.6" />
      <g stroke="var(--color-canard-500)" strokeWidth="1.2" fill="var(--color-canard-300)">
        <path d="M56 49 70 38l10 7-14 11z" />
        <path d="M78 50 92 39l10 7-14 11z" />
      </g>
      <path d="M68 84V68h14v16" fill="var(--color-corail-100)" stroke="var(--color-corail-600)" strokeWidth="1.4" />
      <rect x="50" y="63" width="11" height="9" rx="1" fill="var(--color-neutre-100)" stroke="var(--color-neutre-400)" strokeWidth="1.2" />

      {/* Unité extérieure de pompe à chaleur, adossée à la maison */}
      <rect x="122" y="60" width="34" height="24" rx="3" fill="var(--color-neutre-100)" stroke="var(--color-neutre-400)" strokeWidth="1.5" />
      <circle cx="139" cy="72" r="8" fill="white" stroke="var(--color-canard-500)" strokeWidth="1.2" />
      <path
        d="M139 72V65a7 7 0 0 1 6 3.5zM139 72l6 3.5a7 7 0 0 1-6 3.5zM139 72l-6 3.5a7 7 0 0 1 0-7z"
        fill="var(--color-canard-300)"
      />
      <circle cx="139" cy="72" r="1.8" fill="var(--color-corail-600)" />

      <path d="M20 84h164" stroke="var(--color-neutre-300)" strokeWidth="1.6" />
    </svg>
  );
}

/** Batterie murale de stockage. */
export function IllustrationBatterie({ className = "" }: PropsIllustration) {
  return (
    <svg viewBox="0 0 120 64" className={className} aria-hidden="true">
      <path d="M14 54h92" stroke="var(--color-neutre-300)" strokeWidth="1.5" />
      <rect
        x="38"
        y="10"
        width="44"
        height="40"
        rx="5"
        fill="var(--color-neutre-100)"
        stroke="var(--color-neutre-400)"
        strokeWidth="1.5"
      />
      <rect x="45" y="18" width="30" height="7" rx="2" fill="var(--color-canard-100)" />
      <rect x="45" y="29" width="30" height="7" rx="2" fill="var(--color-canard-300)" />
      <path
        d="M62 38 55 46h6l-1.5 6 7-8h-6z"
        fill="var(--color-corail-600)"
      />
    </svg>
  );
}

/** Unité extérieure de pompe à chaleur. */
export function IllustrationPac({ className = "" }: PropsIllustration) {
  return (
    <svg viewBox="0 0 120 64" className={className} aria-hidden="true">
      <path d="M10 54h100" stroke="var(--color-neutre-300)" strokeWidth="1.5" />
      <rect
        x="30"
        y="14"
        width="60"
        height="36"
        rx="4"
        fill="var(--color-neutre-100)"
        stroke="var(--color-neutre-400)"
        strokeWidth="1.5"
      />
      <circle cx="60" cy="32" r="12" fill="white" stroke="var(--color-canard-500)" strokeWidth="1.2" />
      <path
        d="M60 32 60 22a10 10 0 0 1 8.7 5zM60 32l8.7 5a10 10 0 0 1-8.7 5zM60 32l-8.7 5a10 10 0 0 1 0-10z"
        fill="var(--color-canard-300)"
      />
      <circle cx="60" cy="32" r="2.4" fill="var(--color-corail-600)" />
      <path d="M84 20h4M84 26h4" stroke="var(--color-neutre-400)" strokeWidth="1.5" />
    </svg>
  );
}
