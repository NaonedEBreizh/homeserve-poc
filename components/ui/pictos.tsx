/**
 * Pictogrammes et illustrations, dessinés ici en SVG inline (D46-A).
 *
 * Deux règles : aucune requête réseau — donc pas de bibliothèque d'icônes —
 * et aucune couleur en dur. Le trait prend `currentColor`, le remplissage
 * d'accent prend `--color-corail-600` : les pictogrammes sont bicolores
 * noir/corail sans jamais sortir des tokens de globals.css.
 */
type PropsPicto = { className?: string; taille?: number };

function Svg({
  children,
  className = "",
  taille = 24,
  strokeWidth = 1.75,
}: PropsPicto & { children: React.ReactNode; strokeWidth?: number }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
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

const PICTOS: Record<string, (p: PropsPicto) => React.ReactElement> = {
  solaire: (p) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="4" fill={ACCENT} stroke="none" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
    </Svg>
  ),
  pac: (p) => (
    <Svg {...p}>
      <rect x="3" y="5" width="18" height="12" rx="2" />
      <circle cx="12" cy="11" r="3" fill={ACCENT} stroke="none" />
      <path d="M7 20h10" />
    </Svg>
  ),
  les_deux: (p) => (
    <Svg {...p}>
      <circle cx="8" cy="8" r="3" fill={ACCENT} stroke="none" />
      <rect x="11" y="12" width="10" height="8" rx="2" />
      <path d="M3 20h5" />
    </Svg>
  ),
  radiateurs_electriques: (p) => (
    <Svg {...p}>
      <rect x="5" y="4" width="14" height="14" rx="2" />
      <path d="M9 7v8M12 7v8M15 7v8" stroke={ACCENT} />
      <path d="M7 21h10" />
    </Svg>
  ),
  pompe_a_chaleur: PICTOS_PAC(),
  gaz_fioul_bois: (p) => (
    <Svg {...p}>
      <path d="M12 3c3 4 5 6 5 9a5 5 0 0 1-10 0c0-3 2-5 5-9z" fill={ACCENT} stroke="none" />
      <path d="M12 21v-2" />
    </Svg>
  ),
  autre: (p) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3V14" stroke={ACCENT} />
      <circle cx="12" cy="17.5" r="0.9" fill={ACCENT} stroke="none" />
    </Svg>
  ),
  maison: (p) => (
    <Svg {...p}>
      <path d="M3 11 12 4l9 7" />
      <path d="M5.5 10.5V20h13v-9.5" />
      <path d="M10 20v-5h4v5" fill={ACCENT} stroke="none" />
    </Svg>
  ),
  appartement: (p) => (
    <Svg {...p}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h2M14 7h2M8 11h2M14 11h2" stroke={ACCENT} />
      <path d="M10 21v-4h4v4" />
    </Svg>
  ),
  pro: (p) => (
    <Svg {...p}>
      <path d="M3 9h18v11H3z" />
      <path d="M3 9l2-5h14l2 5" />
      <path d="M9 20v-6h6v6" fill={ACCENT} stroke="none" />
    </Svg>
  ),
  vehicule_electrique: (p) => (
    <Svg {...p}>
      <path d="M4 16v-3l2-5h12l2 5v3" />
      <circle cx="7.5" cy="17.5" r="1.6" />
      <circle cx="16.5" cy="17.5" r="1.6" />
      <path d="M12 9.5 10.5 13h3L12 16" stroke={ACCENT} />
    </Svg>
  ),
  borne_de_recharge: (p) => (
    <Svg {...p}>
      <rect x="7" y="3" width="10" height="14" rx="2" />
      <path d="M12 20v-3M9 20h6" />
      <path d="M12.5 7 11 10.5h2.5L12 14" stroke={ACCENT} />
    </Svg>
  ),
  piscine_ou_jacuzzi: (p) => (
    <Svg {...p}>
      <path d="M3 14c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" stroke={ACCENT} />
      <path d="M3 18c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" />
      <path d="M7 11V5M17 11V5" />
    </Svg>
  ),
  climatisation: (p) => (
    <Svg {...p}>
      <rect x="3" y="5" width="18" height="8" rx="2" />
      <path d="M7 9h10" stroke={ACCENT} />
      <path d="M8 17c0 1.5-1 2-1 3M12 17c0 1.5-1 2-1 3M16 17c0 1.5-1 2-1 3" />
    </Svg>
  ),
  pompe_a_chaleur_equipement: PICTOS_PAC(),
  lave_vaisselle: (p) => (
    <Svg {...p}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M4 8h16" />
      <circle cx="12" cy="14" r="3" fill={ACCENT} stroke="none" />
    </Svg>
  ),
  seche_linge: (p) => (
    <Svg {...p}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <circle cx="12" cy="13" r="5" />
      <path d="M10 13a2 2 0 0 1 4 0" stroke={ACCENT} />
      <path d="M7 6.5h1.5" />
    </Svg>
  ),
  chauffe_eau_equipement: (p) => (
    <Svg {...p}>
      <rect x="7" y="3" width="10" height="15" rx="4" />
      <path d="M10 21h4" />
      <path d="M12 8c1.5 2 2 2.8 2 4a2 2 0 0 1-4 0c0-1.2.5-2 2-4z" fill={ACCENT} stroke="none" />
    </Svg>
  ),
  chauffage_secondaire: (p) => (
    <Svg {...p}>
      <rect x="4" y="6" width="16" height="10" rx="2" />
      <path d="M8 9v4M12 9v4M16 9v4" stroke={ACCENT} />
      <path d="M7 19h10" />
    </Svg>
  ),
  aucun: (p) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M6.5 17.5 17.5 6.5" stroke={ACCENT} />
    </Svg>
  ),
  proprietaire: (p) => (
    <Svg {...p}>
      <path d="M3 11 12 4l9 7" />
      <path d="M5.5 10.5V20h13v-9.5" />
      <circle cx="12" cy="15" r="2" fill={ACCENT} stroke="none" />
    </Svg>
  ),
  locataire: (p) => (
    <Svg {...p}>
      <path d="M3 11 12 4l9 7" />
      <path d="M5.5 10.5V20h13v-9.5" />
      <path d="M9 15h6" stroke={ACCENT} />
    </Svg>
  ),
  oui: (p) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5 11 15.5 16.5 9.5" stroke={ACCENT} />
    </Svg>
  ),
  non: (p) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" stroke={ACCENT} />
    </Svg>
  ),
};

function PICTOS_PAC() {
  return (p: PropsPicto) => (
    <Svg {...p}>
      <rect x="3" y="6" width="18" height="11" rx="2" />
      <circle cx="12" cy="11.5" r="3.2" fill={ACCENT} stroke="none" />
      <path d="M7 20h10" />
    </Svg>
  );
}

/** Pictogramme d'une option, avec un repli neutre si la clé est inconnue. */
export function PictoOption({
  cle,
  className = "",
  taille = 24,
}: PropsPicto & { cle: string }) {
  const Composant = PICTOS[cle];
  if (Composant) return <Composant className={className} taille={taille} />;

  return (
    <Svg className={className} taille={taille}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" fill={ACCENT} stroke="none" />
    </Svg>
  );
}

/* -------------------------------------------------------- illustrations */

type PropsIllustration = { className?: string };

/** Toit couvert de panneaux. */
export function IllustrationToit({ className = "" }: PropsIllustration) {
  return (
    <svg viewBox="0 0 120 64" className={className} aria-hidden="true">
      <path
        d="M8 46 44 18l44 28z"
        fill="var(--color-neutre-100)"
        stroke="var(--color-neutre-400)"
        strokeWidth="1.5"
      />
      <g stroke="var(--color-canard-500)" strokeWidth="1.2" fill="var(--color-canard-100)">
        <path d="M30 40 46 28l12 8-16 12z" />
        <path d="M50 42 66 30l12 8-16 12z" />
      </g>
      <path d="M8 46h96" stroke="var(--color-neutre-300)" strokeWidth="1.5" />
      <circle cx="100" cy="16" r="7" fill="var(--color-corail-100)" />
      <circle cx="100" cy="16" r="3.2" fill="var(--color-corail-600)" />
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
