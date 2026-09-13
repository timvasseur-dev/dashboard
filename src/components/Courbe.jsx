import { versPolyline, versAire, versY } from '../lib/serie.js'
import './Courbe.css'

/*
 * Une courbe d'évolution, en SVG natif — une `polyline`, rien d'autre
 * (cf. CLAUDE.md § 2). Composant pur : il reçoit des valeurs, il trace.
 *
 * Le cadre est un repère fixe étiré en largeur par `preserveAspectRatio`,
 * pour que la courbe remplisse l'écran quelle qu'en soit la taille.
 * `vector-effect="non-scaling-stroke"` empêche l'étirement d'épaissir le
 * trait avec lui.
 */

const LARGEUR = 300 // repère interne ; la largeur réelle vient du CSS

export default function Courbe({
  valeurs,
  hauteur = 72,
  couleur = 'var(--accent)',
  aire = true,
  zone = null,
  messageVide = 'Pas assez de points pour tracer une courbe',
}) {
  const cadre = { largeur: LARGEUR, hauteur, marge: 3 }
  const ligne = versPolyline(valeurs, cadre)
  const bande = zone ? bandeDe(zone, valeurs, cadre) : null

  // Une courbe a besoin de deux points. Un seul, ou aucun, se dit — une
  // ligne plate tracée par défaut se lirait comme un patrimoine immobile.
  if (!ligne) return <p className="courbe__vide">{messageVide}</p>

  return (
    <svg
      className="courbe"
      viewBox={`0 0 ${LARGEUR} ${hauteur}`}
      preserveAspectRatio="none"
      style={{ height: `${hauteur}px` }}
      role="img"
      aria-label="Courbe d’évolution"
    >
      {bande && (
        <rect className="courbe__zone" x="0" y={bande.y} width={LARGEUR} height={bande.hauteur} fill={couleur} />
      )}
      {aire && <polygon className="courbe__aire" points={versAire(valeurs, cadre)} fill={couleur} />}
      <polyline
        className="courbe__ligne"
        points={ligne}
        fill="none"
        stroke={couleur}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/** Bande horizontale d'une zone d'achat, ramenée dans le cadre. Elle peut
 * tomber entièrement au-dessus ou au-dessous de la période affichée — dans ce
 * cas elle n'est pas tracée : une bande collée au bord laisserait croire que
 * le cours a frôlé la zone. */
function bandeDe({ min, max }, valeurs, cadre) {
  const yHaut = versY(max, valeurs, cadre)
  const yBas = versY(min, valeurs, cadre)
  if (yHaut === null || yBas === null) return null
  if (yBas < 0 || yHaut > cadre.hauteur) return null

  const haut = Math.max(0, yHaut)
  const bas = Math.min(cadre.hauteur, yBas)
  return { y: haut, hauteur: Math.max(1, bas - haut) }
}
