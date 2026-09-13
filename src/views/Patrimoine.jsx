import { useState } from 'react'
import Screen from '../components/Screen.jsx'
import BoutonOeil from '../components/BoutonOeil.jsx'
import { useEtat } from '../data/store.js'
import { consolider } from '../lib/portfolio.js'
import PatrimoineEnTete from './PatrimoineEnTete.jsx'
import PatrimoineRepartition from './PatrimoineRepartition.jsx'
import PatrimoineGroupes from './PatrimoineGroupes.jsx'
import PatrimoineInstantanes from './PatrimoineInstantanes.jsx'
import './Patrimoine.css'

/**
 * Assemblage seul : en-tête, répartition, groupes, instantanés. Les calculs
 * sont dans `lib/portfolio.js`, la mise en forme dans les quatre vues
 * appelées ici.
 *
 * `consolider()` ne reçoit jamais `etat` en entier — `watchlist` reste hors de
 * son champ de vision, elle ne peut pas entrer dans le total (CLAUDE.md § 3).
 */
export default function Patrimoine() {
  const etat = useEtat()
  const [axe, setAxe] = useState('classes')

  const consolidation = consolider({
    institutions: etat.institutions,
    accounts: etat.accounts,
    balances: etat.balances,
    positions: etat.positions,
    quotes: etat.quotes,
    fx: etat.fx,
  })
  const { totalEur, plusValueEur, tauxUtilise, coursManquants, montantsNonConvertis } = consolidation

  return (
    <Screen title="Patrimoine" subtitle="Vue consolidée, en euros" action={<BoutonOeil />}>
      <PatrimoineEnTete totalEur={totalEur} plusValueEur={plusValueEur} historique={etat.historique} />

      {coursManquants.length > 0 && (
        <p className="patrimoine__alerte">
          {coursManquants.length} position{coursManquants.length > 1 ? 's' : ''} sans cours, exclue
          {coursManquants.length > 1 ? 's' : ''} du total
        </p>
      )}

      {montantsNonConvertis.length > 0 && (
        <p className="patrimoine__alerte">
          Sans taux USD/EUR, {montantsNonConvertis.length} montant
          {montantsNonConvertis.length > 1 ? 's sont exclus' : ' est exclu'} du total :{' '}
          {montantsNonConvertis.map((m) => m.libelle).join(', ')}
        </p>
      )}

      <PatrimoineRepartition
        axe={axe}
        onAxeChange={setAxe}
        totalEur={totalEur}
        parClasse={consolidation.parClasse}
        parInstitution={consolidation.parInstitution}
        institutions={etat.institutions}
      />

      <PatrimoineGroupes
        axe={axe}
        consolidation={consolidation}
        institutions={etat.institutions}
        quotes={etat.quotes}
      />

      <p className="patrimoine__taux">
        {tauxUtilise ? `Taux USD/EUR utilisé : ${tauxUtilise}` : 'Aucun taux USD/EUR saisi'}
      </p>

      <PatrimoineInstantanes totalEur={totalEur} tauxUsd={tauxUtilise} historique={etat.historique} />
    </Screen>
  )
}
