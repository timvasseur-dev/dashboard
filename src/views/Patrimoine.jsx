import Screen from '../components/Screen.jsx'
import Section from '../components/Section.jsx'
import Row from '../components/Row.jsx'
import { useEtat, enregistrerInstantane } from '../data/store.js'
import { consolider } from '../lib/portfolio.js'
import { formatEur } from '../lib/money.js'
import './Patrimoine.css'

export default function Patrimoine() {
  const etat = useEtat()
  const { totalEur, parInstitution, parClasse, plusValueEur, tauxUtilise, coursManquants } = consolider(etat)
  const dernierInstantane = etat.historique.at(-1)

  return (
    <Screen title="Patrimoine" subtitle="Vue consolidée, en euros">
      <div className="patrimoine__total">
        <span className="patrimoine__total-montant num">{formatEur(totalEur)}</span>
        <span className={`num patrimoine__pv ${plusValueEur >= 0 ? 'patrimoine__pv--pos' : 'patrimoine__pv--neg'}`}>
          {plusValueEur >= 0 ? '+' : ''}
          {formatEur(plusValueEur)} de plus-value latente
        </span>
      </div>

      <p className="patrimoine__taux">
        {tauxUtilise ? `Taux USD/EUR utilisé : ${tauxUtilise}` : 'Aucun taux USD/EUR saisi'}
      </p>

      {coursManquants.length > 0 && (
        <p className="patrimoine__alerte">
          {coursManquants.length} position{coursManquants.length > 1 ? 's' : ''} sans cours, exclue
          {coursManquants.length > 1 ? 's' : ''} du total
        </p>
      )}

      <Section titre="Par institution">
        {etat.institutions.map((institution) => (
          <Row key={institution.id} libelle={institution.nom}>
            <span className="num">{formatEur(parInstitution[institution.id] ?? 0)}</span>
          </Row>
        ))}
      </Section>

      <Section titre="Par classe">
        <Row libelle="Espèces">
          <span className="num">{formatEur(parClasse.especes)}</span>
        </Row>
        <Row libelle="Titres">
          <span className="num">{formatEur(parClasse.titres)}</span>
        </Row>
      </Section>

      <button
        className="patrimoine__instantane"
        onClick={() => enregistrerInstantane({ totalEur, tauxUsd: tauxUtilise })}
      >
        Enregistrer un instantané
      </button>
      <p className="patrimoine__dernier">
        {dernierInstantane
          ? `Dernier instantané : ${new Date(dernierInstantane.date).toLocaleString('fr-FR')}`
          : 'Aucun instantané enregistré'}
      </p>
    </Screen>
  )
}
