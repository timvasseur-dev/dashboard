import { useState } from 'react'
import Montant from '../components/Montant.jsx'
import Courbe from '../components/Courbe.jsx'
import SelecteurPeriode from '../components/SelecteurPeriode.jsx'
import { debutPeriode, PERIODES_PATRIMOINE } from '../lib/periode.js'
import { serieHistorique, pointsSurPeriode, variationSurPeriode } from '../lib/historique.js'
import './PatrimoineEnTete.css'

const formatteurPourcentage = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

// « Tout » par défaut : l'historique se remplit un point par jour à partir de
// maintenant, et une fenêtre glissante n'aurait longtemps rien à montrer.
const PERIODE_PAR_DEFAUT = 'tout'

/**
 * Le total, son évolution, sa variation sur la période.
 *
 * Rien n'est reconstruit : la courbe ne montre que les instantanés réellement
 * enregistrés. Quand il n'y en a pas assez, elle le dit — une ligne plate
 * tracée par défaut se lirait comme un patrimoine immobile, et une variation
 * de 0 % comme une mesure.
 */
export default function PatrimoineEnTete({ totalEur, plusValueEur, historique }) {
  const [periode, setPeriode] = useState(PERIODE_PAR_DEFAUT)

  const serie = serieHistorique(historique)
  const debut = debutPeriode(periode)
  const points = pointsSurPeriode(serie, debut)
  const variation = variationSurPeriode(serie, debut)

  return (
    <div className="entete">
      <Montant valeur={totalEur} className="entete__total" />

      <p className="entete__variation">
        {variation ? (
          <span className={variation.montant >= 0 ? 'entete__hausse' : 'entete__baisse'}>
            <Montant valeur={variation.montant} signe />
            {variation.pourcentage !== null &&
              ` (${variation.pourcentage >= 0 ? '+' : ''}${formatteurPourcentage.format(variation.pourcentage)} %)`}
          </span>
        ) : (
          <span className="entete__indisponible">Pas encore assez d’instantanés sur cette période</span>
        )}
      </p>

      <Courbe
        valeurs={points.map((instantane) => instantane.totalEur)}
        messageVide="La courbe se remplira d’elle-même, un point par jour"
      />

      <SelecteurPeriode periodes={PERIODES_PATRIMOINE} valeur={periode} onChange={setPeriode} />

      {/* La couleur porte sur le montant seul : le libellé reste en gris,
          sinon toute la ligne clignote en vert ou en rouge. */}
      <p className="entete__pv">
        <Montant valeur={plusValueEur} signe className={plusValueEur >= 0 ? 'entete__hausse' : 'entete__baisse'} />{' '}
        de plus-value latente sur les positions
      </p>
    </div>
  )
}
