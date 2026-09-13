import Row from '../components/Row.jsx'
import Age from '../components/Age.jsx'
import Courbe from '../components/Courbe.jsx'
import { useHistoriqueCours } from '../data/historiqueCours.js'
import { ouvrirTitre } from '../data/modaleTitre.js'
import { cleMarche } from '../data/rafraichissement.js'
import { formatDevise } from '../lib/money.js'
import './MarcheIndicateur.css'

const formatteurPourcentage = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })
const formatteurPoints = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })

// Assez court pour rester lisible dans une ligne de 390 px, assez long pour
// qu'une tendance se voie.
const PERIODE_VIGNETTE = '3m'

/**
 * Une ligne de l'écran Marché : indice ou matière première, avec son cours, sa
 * variation du jour et une vignette de tendance. Taper ouvre la modale.
 *
 * Aucun de ces chiffres n'entre dans un patrimoine (CLAUDE.md § 4), et aucun
 * n'est masqué par l'œil : ce sont des données publiques, elles ne disent rien
 * de ce qu'on détient.
 */
export default function MarcheIndicateur({ indicateur, cours }) {
  const historique = useHistoriqueCours(indicateur.ticker, PERIODE_VIGNETTE)
  const valeurs = historique.statut === 'pret' ? historique.donnees.points.map((point) => point.cloture) : []

  return (
    <Row
      libelle={indicateur.libelle}
      sousLibelle={indicateur.detail}
      onClick={() =>
        ouvrirTitre({
          ticker: indicateur.ticker,
          cleCours: cleMarche(indicateur.ticker),
          libelle: indicateur.libelle,
          nature: indicateur.nature,
        })
      }
    >
      <span className="indicateur__vignette">
        {valeurs.length > 1 && (
          <Courbe
            valeurs={valeurs}
            hauteur={28}
            aire={false}
            couleur={tendance(valeurs) >= 0 ? 'var(--positive)' : 'var(--negative)'}
          />
        )}
      </span>

      {cours ? (
        <span className="indicateur__valeur">
          <span className="num">
            {indicateur.nature === 'indice'
              ? formatteurPoints.format(cours.prix)
              : formatDevise(cours.prix, cours.devise)}
          </span>
          {cours.variationJour != null && (
            <span className={`num ${cours.variationJour >= 0 ? 'indicateur__hausse' : 'indicateur__baisse'}`}>
              {cours.variationJour >= 0 ? '+' : ''}
              {formatteurPourcentage.format(cours.variationJour)} %
            </span>
          )}
          <Age horodatage={cours.horodatage} />
        </span>
      ) : (
        <span className="indisponible">indisponible</span>
      )}
    </Row>
  )
}

/** Sens de la période, pour colorer la vignette. Le premier et le dernier
 * point suffisent : la vignette dit une direction, pas une performance. */
function tendance(valeurs) {
  return valeurs[valeurs.length - 1] - valeurs[0]
}
