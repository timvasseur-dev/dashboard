import Anneau from '../components/Anneau.jsx'
import Montant from '../components/Montant.jsx'
import { AXES, segmentsDe, partDuTotal } from './patrimoineAxes.js'
import './PatrimoineRepartition.css'

const formatteurPourcentage = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

/**
 * L'anneau de répartition et sa légende. L'axe choisi ici commande aussi le
 * découpage de la liste dépliable en dessous : un seul geste, une seule
 * lecture du patrimoine à la fois.
 */
export default function PatrimoineRepartition({ axe, onAxeChange, totalEur, parClasse, parInstitution, institutions }) {
  const segments = segmentsDe(axe, { parClasse, parInstitution, institutions })
  const visibles = segments.filter((segment) => segment.valeur > 0)

  return (
    <div className="repartition">
      <div className="repartition__axes" role="group" aria-label="Axe de répartition">
        {AXES.map((choix) => (
          <button
            key={choix.cle}
            className="repartition__axe"
            aria-pressed={choix.cle === axe}
            onClick={() => onAxeChange(choix.cle)}
          >
            {choix.libelle}
          </button>
        ))}
      </div>

      <Anneau segments={segments}>
        <Montant valeur={totalEur} className="repartition__centre-montant" />
        <span className="repartition__centre-libelle">au total</span>
      </Anneau>

      <ul className="repartition__legende">
        {visibles.map((segment) => (
          <li key={segment.cle} className="repartition__ligne">
            <span className="repartition__pastille" style={{ background: segment.couleur }} />
            <span className="repartition__libelle">{segment.libelle}</span>
            <span className="repartition__part num">
              {formatteurPourcentage.format(partDuTotal(segment.valeur, totalEur) * 100)} %
            </span>
            <Montant valeur={segment.valeur} />
          </li>
        ))}
        {visibles.length === 0 && <li className="repartition__vide">Rien à répartir pour l’instant</li>}
      </ul>
    </div>
  )
}
