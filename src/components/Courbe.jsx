import { useId } from 'react'
import { versPolyline, versAire, versY } from '../lib/serie.js'
import './Courbe.css'

/*
 * Une courbe d'évolution, en SVG natif — une `polyline`, rien d'autre
 * (cf. CLAUDE.md § 2). Sans état : il reçoit des valeurs, il trace.
 *
 * Le cadre est un repère fixe étiré en largeur par `preserveAspectRatio`,
 * pour que la courbe remplisse l'écran quelle qu'en soit la taille.
 * `vector-effect="non-scaling-stroke"` empêche l'étirement d'épaissir le
 * trait avec lui.
 *
 * Le remplissage est un dégradé, de 12 % d'opacité sous le trait à rien en
 * bas du cadre. Il lui faut une définition, donc un identifiant : `useId`
 * plutôt qu'une constante, parce que l'écran Marché affiche plusieurs courbes
 * à la fois et qu'un même identifiant répété ferait toutes les aires de la
 * couleur de la première. Les deux-points que React y place sont retirés :
 * ils n'ont rien à faire dans un `url(#…)`.
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
  const degrade = `courbe-${useId().replace(/:/g, '')}`
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
      {aire && (
        <defs>
          {/* Les arrêts portent leur couleur en style et non en attribut : la
              couleur arrive en `var(--…)`, qui se résout à coup sûr là. */}
          <linearGradient id={degrade} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: couleur, stopOpacity: 0.12 }} />
            <stop offset="1" style={{ stopColor: couleur, stopOpacity: 0 }} />
          </linearGradient>
        </defs>
      )}
      {bande && (
        <rect className="courbe__zone" x="0" y={bande.y} width={LARGEUR} height={bande.hauteur} fill={couleur} />
      )}
      {aire && <polygon className="courbe__aire" points={versAire(valeurs, cadre)} fill={`url(#${degrade})`} />}
      <polyline
        className="courbe__ligne"
        points={ligne}
        fill="none"
        stroke={couleur}
        strokeWidth="1.5"
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
