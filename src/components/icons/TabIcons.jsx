/*
 * Les cinq icônes d'onglets, en SVG inline.
 * Tracé uniquement, sans remplissage : la couleur vient de currentColor.
 */

function Svg({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

/* Patrimoine : part de camembert, la répartition du total */
export function IconPatrimoine() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5v8.5h8.5" />
    </Svg>
  )
}

/* Comptes : portefeuille */
export function IconComptes() {
  return (
    <Svg>
      <rect x="3" y="6" width="18" height="13" rx="2.5" />
      <path d="M3 10h18" />
      <circle cx="16.5" cy="14.5" r="1.2" />
    </Svg>
  )
}

/* Bourse : courbe ascendante */
export function IconBourse() {
  return (
    <Svg>
      <path d="M4 16.5l4.5-5 3.5 3 7-8" />
      <path d="M15 6.5h4v4" />
    </Svg>
  )
}

/* Marché : globe, les indicateurs extérieurs */
export function IconMarche() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.4 2.6 3.6 5.4 3.6 8.5s-1.2 5.9-3.6 8.5c-2.4-2.6-3.6-5.4-3.6-8.5S9.6 6.1 12 3.5z" />
    </Svg>
  )
}

/* Réglages : curseurs */
export function IconReglages() {
  return (
    <Svg>
      <path d="M4 8h10M18 8h2M4 16h4M12 16h8" />
      <circle cx="16" cy="8" r="2" />
      <circle cx="10" cy="16" r="2" />
    </Svg>
  )
}
