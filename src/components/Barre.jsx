import './Barre.css'

/** Part du total, en barre — un `rect` dans un repère de 100 unités, étiré à
 * la largeur disponible. Composant pur. `part` est une fraction de 0 à 1 ;
 * hors bornes, elle est ramenée dedans plutôt que de déborder du cadre. */
export default function Barre({ part, couleur = 'var(--accent)' }) {
  const largeur = Math.max(0, Math.min(1, part)) * 100

  return (
    <svg className="barre" viewBox="0 0 100 4" preserveAspectRatio="none" role="presentation">
      <rect x="0" y="0" width="100" height="4" rx="2" fill="var(--border)" />
      {largeur > 0 && <rect x="0" y="0" width={largeur} height="4" rx="2" fill={couleur} />}
    </svg>
  )
}
