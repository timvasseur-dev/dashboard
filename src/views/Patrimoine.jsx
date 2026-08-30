import { useState } from 'react'
import Screen from '../components/Screen.jsx'
import Section from '../components/Section.jsx'
import Row from '../components/Row.jsx'
import { useEtat, enregistrerInstantane } from '../data/store.js'
import { consolider } from '../lib/portfolio.js'
import { formatEur, formatDevise } from '../lib/money.js'
import './Patrimoine.css'

const LIBELLE_TYPE = { courant: 'Courant', epargne: 'Épargne', pea: 'PEA', cto: 'CTO' }

export default function Patrimoine() {
  const etat = useEtat()
  const {
    totalEur,
    parInstitution,
    parClasse,
    plusValueEur,
    tauxUtilise,
    coursManquants,
    comptesParInstitution,
    positionsParInstitution,
    positionsTitres,
    comptesCash,
    comptesEpargne,
    comptesEnveloppe,
  } = consolider(etat)
  const dernierInstantane = etat.historique.at(-1)

  const [institutionsOuvertes, setInstitutionsOuvertes] = useState(() => new Set())
  const [classesOuvertes, setClassesOuvertes] = useState(() => new Set())

  const basculer = (ensemble, setEnsemble, cle) => {
    const suivant = new Set(ensemble)
    suivant.has(cle) ? suivant.delete(cle) : suivant.add(cle)
    setEnsemble(suivant)
  }

  const institutionDe = (institutionId) => etat.institutions.find((i) => i.id === institutionId)

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
        {etat.institutions.map((institution) => {
          const ouvert = institutionsOuvertes.has(institution.id)
          const comptes = comptesParInstitution[institution.id] ?? []
          const positions = positionsParInstitution[institution.id] ?? []
          return (
            <div key={institution.id} className="patrimoine__groupe">
              <Row
                libelle={institution.nom}
                onClick={() => basculer(institutionsOuvertes, setInstitutionsOuvertes, institution.id)}
              >
                <span className="num">{formatEur(parInstitution[institution.id] ?? 0)}</span>
                <span className="patrimoine__chevron">{ouvert ? '▾' : '▸'}</span>
              </Row>
              {ouvert && (
                <div className="patrimoine__detail">
                  {comptes.map(({ compte, montant, montantEur }) => (
                    <CompteLigne key={compte.id} compte={compte} montant={montant} montantEur={montantEur} />
                  ))}
                  {positions.map((ligne) => (
                    <PositionLigne key={ligne.position.id} {...ligne} />
                  ))}
                  {comptes.length === 0 && positions.length === 0 && (
                    <p className="patrimoine__detail-vide">Aucun compte</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </Section>

      <Section titre="Par classe">
        <div className="patrimoine__groupe">
          <Row libelle="Cash" onClick={() => basculer(classesOuvertes, setClassesOuvertes, 'cash')}>
            <span className="num">{formatEur(parClasse.cash)}</span>
            <span className="patrimoine__chevron">{classesOuvertes.has('cash') ? '▾' : '▸'}</span>
          </Row>
          {classesOuvertes.has('cash') && (
            <div className="patrimoine__detail">
              {comptesCash.map(({ compte, montant, montantEur }) => (
                <CompteLigne
                  key={compte.id}
                  compte={compte}
                  montant={montant}
                  montantEur={montantEur}
                  sousLibelle={institutionDe(compte.institutionId)?.nom ?? ''}
                />
              ))}
              {comptesCash.length === 0 && <p className="patrimoine__detail-vide">Aucun compte</p>}
            </div>
          )}
        </div>

        <div className="patrimoine__groupe">
          <Row libelle="Épargne" onClick={() => basculer(classesOuvertes, setClassesOuvertes, 'epargne')}>
            <span className="num">{formatEur(parClasse.epargne)}</span>
            <span className="patrimoine__chevron">{classesOuvertes.has('epargne') ? '▾' : '▸'}</span>
          </Row>
          {classesOuvertes.has('epargne') && (
            <div className="patrimoine__detail">
              {comptesEpargne.map(({ compte, montant, montantEur }) => (
                <CompteLigne
                  key={compte.id}
                  compte={compte}
                  montant={montant}
                  montantEur={montantEur}
                  sousLibelle={institutionDe(compte.institutionId)?.nom ?? ''}
                />
              ))}
              {comptesEpargne.length === 0 && <p className="patrimoine__detail-vide">Aucun compte</p>}
            </div>
          )}
        </div>

        <div className="patrimoine__groupe">
          <Row libelle="Titres" onClick={() => basculer(classesOuvertes, setClassesOuvertes, 'titres')}>
            <span className="num">{formatEur(parClasse.titres)}</span>
            <span className="patrimoine__chevron">{classesOuvertes.has('titres') ? '▾' : '▸'}</span>
          </Row>
          {classesOuvertes.has('titres') && (
            <div className="patrimoine__detail">
              {comptesEnveloppe.map(({ compte, montant, montantEur }) => (
                <CompteLigne
                  key={compte.id}
                  compte={compte}
                  montant={montant}
                  montantEur={montantEur}
                  sousLibelle={`${institutionDe(compte.institutionId)?.nom ?? ''} · cash non investi`}
                />
              ))}
              {positionsTitres.map((ligne) => (
                <PositionLigne key={ligne.position.id} {...ligne} />
              ))}
              {comptesEnveloppe.length === 0 && positionsTitres.length === 0 && (
                <p className="patrimoine__detail-vide">Aucune position</p>
              )}
            </div>
          )}
        </div>
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

function CompteLigne({ compte, montant, montantEur, sousLibelle }) {
  return (
    <Row libelle={compte.libelle} sousLibelle={sousLibelle ?? LIBELLE_TYPE[compte.type]}>
      <span className="patrimoine__detail-valeur">
        <span className="num">{formatDevise(montant, compte.devise)}</span>
        {compte.devise !== 'EUR' && <span className="num patrimoine__detail-eur">{formatEur(montantEur)}</span>}
      </span>
    </Row>
  )
}

function PositionLigne({ position, compte, valeurEur, plusValueEur, coursManquant }) {
  return (
    <Row
      libelle={position.ticker}
      sousLibelle={`${compte?.libelle ?? ''} · ${position.quantite} × ${formatDevise(position.pru, position.devise)}`}
    >
      {coursManquant ? (
        <span className="patrimoine__sans-cours">sans cours</span>
      ) : (
        <span className="patrimoine__detail-valeur">
          <span className="num">{formatEur(valeurEur)}</span>
          {plusValueEur !== null && (
            <span
              className={`num patrimoine__pv-detail ${plusValueEur >= 0 ? 'patrimoine__pv--pos' : 'patrimoine__pv--neg'}`}
            >
              {plusValueEur >= 0 ? '+' : ''}
              {formatEur(plusValueEur)}
            </span>
          )}
        </span>
      )}
    </Row>
  )
}
