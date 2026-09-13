import './Anneau.css'

/*
 * Anneau de répartition : un `circle` par segment, découpé au
 * `stroke-dasharray` (cf. CLAUDE.md § 2). Composant pur.
 *
 * Le tracé d'un cercle SVG démarre à 3 heures ; la rotation d'un quart de
 * tour le ramène à midi, là où l'œil attend le début d'un camembert.
 */

const TAILLE = 120
const RAYON = 50
const CIRCONFERENCE = 2 * Math.PI * RAYON

/**
 * `segments` : `[{ cle, valeur, couleur }]`. Les valeurs nulles ou négatives
 * sont ignorées — un anneau ne sait pas représenter une part négative, et en
 * inventer une serait pire que de ne rien montrer.
 */
export default function Anneau({ segments, epaisseur = 14, children }) {
  const retenus = segments.filter((segment) => segment.valeur > 0)
  const total = retenus.reduce((somme, segment) => somme + segment.valeur, 0)

  let parcouru = 0

  return (
    <div className="anneau">
      <svg viewBox={`0 0 ${TAILLE} ${TAILLE}`} className="anneau__svg" role="presentation">
        <g transform={`rotate(-90 ${TAILLE / 2} ${TAILLE / 2})`}>
          <circle
            cx={TAILLE / 2}
            cy={TAILLE / 2}
            r={RAYON}
            fill="none"
            stroke="var(--border)"
            strokeWidth={epaisseur}
          />
          {total > 0 &&
            retenus.map((segment) => {
              const part = segment.valeur / total
              const decalage = -parcouru * CIRCONFERENCE
              parcouru += part
              return (
                <circle
                  key={segment.cle}
                  cx={TAILLE / 2}
                  cy={TAILLE / 2}
                  r={RAYON}
                  fill="none"
                  stroke={segment.couleur}
                  strokeWidth={epaisseur}
                  strokeDasharray={`${part * CIRCONFERENCE} ${CIRCONFERENCE}`}
                  strokeDashoffset={decalage}
                />
              )
            })}
        </g>
      </svg>
      <div className="anneau__centre">{children}</div>
    </div>
  )
}
