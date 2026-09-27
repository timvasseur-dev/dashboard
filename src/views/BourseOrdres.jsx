import { useState } from 'react'
import Section from '../components/Section.jsx'
import Row from '../components/Row.jsx'
import Montant from '../components/Montant.jsx'
import { annulerDernierOrdre } from '../data/storeOrdres.js'
import { ordresRecents, plusValueRealisee, plusValuesParAnnee, peutAnnuler } from '../lib/ordres.js'
import { formatDevise } from '../lib/money.js'
import { formatDateAffichee } from '../lib/date.js'
import './BourseOrdres.css'

const classeVariation = (montant) => (montant >= 0 ? 'ordres__pv--pos' : 'ordres__pv--neg')

/**
 * Les ordres saisis et les plus-values qu'ils ont réalisées. Rien tant
 * qu'aucun ordre n'existe : le bouton de saisie est sous « Mes positions ».
 *
 * Les plus-values sont en prix moyen pondéré, dans la devise de chaque ligne
 * (cf. lib/ordres.js). Le total annuel en euros convertit les dollars au taux
 * du jour : un repère, pas un montant fiscal, et c'est écrit à côté.
 */
export default function BourseOrdres({ etat }) {
  if (etat.ordres.length === 0) return null

  const tauxUsd = etat.fx['USD/EUR']?.taux ?? null
  return (
    <Section titre="Ordres">
      {plusValuesParAnnee(etat.ordres, tauxUsd).map((annee) => (
        <TotalAnnee key={annee.annee} {...annee} />
      ))}
      {ordresRecents(etat.ordres).map((ordre) => (
        <LigneOrdre key={ordre.id} ordre={ordre} etat={etat} />
      ))}
    </Section>
  )
}

function TotalAnnee({ annee, parDevise, totalEur }) {
  const devises = Object.keys(parDevise)
  const convertie = devises.some((devise) => devise !== 'EUR')

  return (
    <Row
      libelle={`Plus-values réalisées ${annee}`}
      sousLibelle={
        convertie && (
          <>
            {devises.map((devise, rang) => (
              <span key={devise}>
                {rang > 0 && ' · '}
                <Montant valeur={parDevise[devise]} devise={devise} signe />
              </span>
            ))}
            {totalEur !== null && ' · total au taux du jour'}
          </>
        )
      }
    >
      {totalEur === null ? (
        <span className="ordres__sans-taux">sans taux USD/EUR</span>
      ) : (
        <Montant valeur={totalEur} signe className={`ordres__montant ${classeVariation(totalEur)}`} />
      )}
    </Row>
  )
}

function LigneOrdre({ ordre, etat }) {
  const [confirmation, setConfirmation] = useState(false)
  const compte = etat.accounts.find((c) => c.id === ordre.accountId)
  const plusValue = plusValueRealisee(ordre)
  const annulable = peutAnnuler(ordre, etat)

  return (
    <Row
      libelle={`${ordre.sens === 'achat' ? 'Achat' : 'Vente'} ${ordre.ticker}`}
      sousLibelle={
        <>
          {formatDateAffichee(ordre.date)} · {compte?.libelle ?? 'compte supprimé'} ·{' '}
          <Montant valeur={ordre.quantite} brut /> × <span className="num">{formatDevise(ordre.cours, ordre.devise)}</span>
          {ordre.frais > 0 && (
            <>
              {' '}
              · frais <Montant valeur={ordre.frais} devise={ordre.devise} />
            </>
          )}
        </>
      }
    >
      <span className="ordres__colonne">
        {plusValue === null ? (
          // Un achat ne réalise rien : on montre ce qu'il a coûté, frais compris.
          <Montant valeur={ordre.quantite * ordre.cours + ordre.frais} devise={ordre.devise} className="ordres__montant" />
        ) : (
          <Montant
            valeur={plusValue}
            devise={ordre.devise}
            signe
            className={`ordres__montant ${classeVariation(plusValue)}`}
          />
        )}
        {annulable &&
          (confirmation ? (
            <button
              type="button"
              className="comptes__supprimer comptes__supprimer--confirme"
              onClick={() => annulerDernierOrdre(ordre.id)}
            >
              Confirmer
            </button>
          ) : (
            <button type="button" className="comptes__supprimer" onClick={() => setConfirmation(true)}>
              Annuler
            </button>
          ))}
      </span>
    </Row>
  )
}

/** Les ordres d'une ligne et la plus-value qu'ils ont réalisée : des lignes
 * de définition, à poser dans le détail de la position de la fiche titre.
 * Rien si la ligne n'a aucun ordre — elle a été saisie à la main. */
export function OrdresTitre({ position, ordres }) {
  const ordresLigne = ordresRecents(ordres.filter((o) => o.positionId === position.id))
  if (ordresLigne.length === 0) return null

  const ventes = ordresLigne.map(plusValueRealisee).filter((pv) => pv !== null)
  const cumul = ventes.reduce((somme, pv) => somme + pv, 0)

  return (
    <>
      {ventes.length > 0 && (
        <div className="titre__ligne">
          <dt className="titre__libelle">Plus-value réalisée</dt>
          <dd className="titre__valeur">
            <Montant valeur={cumul} devise={position.devise} signe className={cumul >= 0 ? 'titre__hausse' : 'titre__baisse'} />
          </dd>
        </div>
      )}
      {ordresLigne.map((ordre) => (
        <div key={ordre.id} className="titre__ligne">
          <dt className="titre__libelle">
            {ordre.sens === 'achat' ? 'Achat' : 'Vente'} du {formatDateAffichee(ordre.date)}
          </dt>
          <dd className="titre__valeur">
            <Montant valeur={ordre.quantite} brut /> × <span className="num">{formatDevise(ordre.cours, ordre.devise)}</span>
          </dd>
        </div>
      ))}
    </>
  )
}
