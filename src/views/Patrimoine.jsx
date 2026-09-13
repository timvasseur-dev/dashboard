import { useState } from 'react'
import Screen from '../components/Screen.jsx'
import Section from '../components/Section.jsx'
import Row from '../components/Row.jsx'
import { useEtat } from '../data/store.js'
import { consolider } from '../lib/portfolio.js'
import Montant from '../components/Montant.jsx'
import BoutonOeil from '../components/BoutonOeil.jsx'
import PatrimoineInstantanes from './PatrimoineInstantanes.jsx'
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
    montantsNonConvertis,
    comptesParInstitution,
    positionsParInstitution,
    positionsTitres,
    comptesCash,
    comptesEpargne,
    comptesEnveloppe,
  } = consolider({
    institutions: etat.institutions,
    accounts: etat.accounts,
    balances: etat.balances,
    positions: etat.positions,
    quotes: etat.quotes,
    fx: etat.fx,
  })
  const [institutionsOuvertes, setInstitutionsOuvertes] = useState(() => new Set())
  const [classesOuvertes, setClassesOuvertes] = useState(() => new Set())

  const basculer = (ensemble, setEnsemble, cle) => {
    const suivant = new Set(ensemble)
    suivant.has(cle) ? suivant.delete(cle) : suivant.add(cle)
    setEnsemble(suivant)
  }

  const institutionDe = (institutionId) => etat.institutions.find((i) => i.id === institutionId)

  return (
    <Screen title="Patrimoine" subtitle="Vue consolidée, en euros" action={<BoutonOeil />}>
      <div className="patrimoine__total">
        <Montant valeur={totalEur} className="patrimoine__total-montant" />
        <span className={`patrimoine__pv ${plusValueEur >= 0 ? 'patrimoine__pv--pos' : 'patrimoine__pv--neg'}`}>
          <Montant valeur={plusValueEur} signe /> de plus-value latente
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

      {montantsNonConvertis.length > 0 && (
        <p className="patrimoine__alerte">
          Sans taux USD/EUR, {montantsNonConvertis.length} montant
          {montantsNonConvertis.length > 1 ? 's sont exclus' : ' est exclu'} du total :{' '}
          {montantsNonConvertis.map((m) => m.libelle).join(', ')}
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
                <Montant valeur={parInstitution[institution.id] ?? 0} />
                <span className="patrimoine__chevron">{ouvert ? '▾' : '▸'}</span>
              </Row>
              {ouvert && (
                <div className="patrimoine__detail">
                  {comptes.map(({ compte, montant, montantEur }) => (
                    <CompteLigne key={compte.id} compte={compte} montant={montant} montantEur={montantEur} />
                  ))}
                  {positions.map((ligne) => (
                    <PositionLigne key={ligne.position.id} {...ligne} cours={etat.quotes[ligne.position.ticker]} />
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
            <Montant valeur={parClasse.cash} />
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
              {/* Le cash logé dans un PEA ou un CTO compte ici, mais reste
                  distingué : il n'est pas mobilisable comme un compte courant. */}
              {comptesEnveloppe.map(({ compte, montant, montantEur }) => (
                <CompteLigne
                  key={compte.id}
                  compte={compte}
                  montant={montant}
                  montantEur={montantEur}
                  sousLibelle={`${institutionDe(compte.institutionId)?.nom ?? ''} · cash non investi`}
                />
              ))}
              {comptesCash.length === 0 && comptesEnveloppe.length === 0 && (
                <p className="patrimoine__detail-vide">Aucun compte</p>
              )}
            </div>
          )}
        </div>

        <div className="patrimoine__groupe">
          <Row libelle="Épargne" onClick={() => basculer(classesOuvertes, setClassesOuvertes, 'epargne')}>
            <Montant valeur={parClasse.epargne} />
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
            <Montant valeur={parClasse.titres} />
            <span className="patrimoine__chevron">{classesOuvertes.has('titres') ? '▾' : '▸'}</span>
          </Row>
          {classesOuvertes.has('titres') && (
            <div className="patrimoine__detail">
              {positionsTitres.map((ligne) => (
                <PositionLigne key={ligne.position.id} {...ligne} cours={etat.quotes[ligne.position.ticker]} />
              ))}
              {positionsTitres.length === 0 && <p className="patrimoine__detail-vide">Aucune position</p>}
            </div>
          )}
        </div>
      </Section>

      <PatrimoineInstantanes totalEur={totalEur} tauxUsd={tauxUtilise} historique={etat.historique} />
    </Screen>
  )
}

function CompteLigne({ compte, montant, montantEur, sousLibelle }) {
  return (
    <Row libelle={compte.libelle} sousLibelle={sousLibelle ?? LIBELLE_TYPE[compte.type]}>
      <span className="patrimoine__detail-valeur">
        <Montant valeur={montant} devise={compte.devise} />
        {compte.devise !== 'EUR' &&
          (montantEur === null ? (
            // Surtout pas formatEur(null), qui afficherait « 0,00 € » pour un
            // montant qu'on ne sait simplement pas convertir.
            <span className="patrimoine__sans-cours">sans taux</span>
          ) : (
            <Montant valeur={montantEur} className="patrimoine__detail-eur" />
          ))}
      </span>
    </Row>
  )
}

function PositionLigne({ position, compte, valeurEur, plusValueEur, coursManquant, nonConverti, cours }) {
  return (
    <Row
      libelle={cours?.nom ?? position.ticker}
      sousLibelle={
        <>
          {position.ticker} · {compte?.libelle ?? ''} · <Montant valeur={position.quantite} brut /> ×{' '}
          <Montant valeur={position.pru} devise={position.devise} />
        </>
      }
    >
      <span className="patrimoine__detail-valeur">
        {cours && cours.devise !== position.devise && (
          <span className="patrimoine__devise-alerte">
            ⚠ {cours.devise} ≠ {position.devise}
          </span>
        )}
        {coursManquant || nonConverti ? (
          <span className="patrimoine__sans-cours">{coursManquant ? 'sans cours' : 'sans taux'}</span>
        ) : (
          <>
            <Montant valeur={valeurEur} />
            {plusValueEur !== null && (
              <Montant
                valeur={plusValueEur}
                signe
                className={`patrimoine__pv-detail ${plusValueEur >= 0 ? 'patrimoine__pv--pos' : 'patrimoine__pv--neg'}`}
              />
            )}
          </>
        )}
      </span>
    </Row>
  )
}
