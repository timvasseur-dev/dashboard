import { useState } from 'react'
import Screen from '../components/Screen.jsx'
import Section from '../components/Section.jsx'
import Row from '../components/Row.jsx'
import Sheet from '../components/Sheet.jsx'
import { useEtat, rattacherPositionOrpheline, supprimerPositionOrpheline } from '../data/store.js'
import { valoriserPosition } from '../lib/portfolio.js'
import { formatEur, formatDevise } from '../lib/money.js'
import FormulaireBourse from './BourseFormulaire.jsx'
import './Bourse.css'

const formatteurPourcentage = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

const TITRES_SHEET = {
  'nouvelle-position': 'Ajouter une position',
  position: 'Modifier la position',
  'nouveau-suivi': 'Ajouter à la watchlist',
  suivi: 'Modifier le suivi',
  promotion: 'Promouvoir en position',
}

export default function Bourse() {
  const etat = useEtat()
  const [sheet, setSheet] = useState(null)
  const tauxUsd = etat.fx['USD/EUR']?.taux ?? null

  const comptesTitres = etat.accounts.filter((c) => c.type === 'pea' || c.type === 'cto')

  return (
    <Screen title="Bourse" subtitle="Positions PEA et CTO">
      <Section titre="Mes positions">
        {comptesTitres.flatMap((compte) =>
          etat.positions
            .filter((p) => p.accountId === compte.id)
            .map((position) => {
              const cours = etat.quotes[position.ticker]
              const { valeurEur, plusValueEur, coutRevientEur } = valoriserPosition(position, cours, tauxUsd)
              const pourcentage = coutRevientEur ? (plusValueEur / coutRevientEur) * 100 : null
              return (
                <Row
                  key={position.id}
                  libelle={position.ticker}
                  sousLibelle={`${compte.libelle} · ${position.quantite} × ${formatDevise(position.pru, position.devise)}`}
                >
                  {valeurEur === null ? (
                    <span className="bourse__sans-cours">sans cours</span>
                  ) : (
                    <span className="bourse__valeur">
                      <span className="num bourse__cours">{formatDevise(cours.prix, cours.devise)}</span>
                      <span className="num">{formatEur(valeurEur)}</span>
                      {plusValueEur !== null && (
                        <span
                          className={`num bourse__pv ${plusValueEur >= 0 ? 'bourse__pv--pos' : 'bourse__pv--neg'}`}
                        >
                          {plusValueEur >= 0 ? '+' : ''}
                          {formatEur(plusValueEur)}
                          {pourcentage !== null &&
                            ` (${pourcentage >= 0 ? '+' : ''}${formatteurPourcentage.format(pourcentage)} %)`}
                        </span>
                      )}
                    </span>
                  )}
                  <button
                    className="comptes__gerer"
                    aria-label="Gérer la position"
                    onClick={() => setSheet({ mode: 'position', position })}
                  >
                    ⋯
                  </button>
                </Row>
              )
            }),
        )}
        {comptesTitres.length > 0 ? (
          <button className="bourse__ajouter" onClick={() => setSheet({ mode: 'nouvelle-position' })}>
            + Ajouter une position
          </button>
        ) : (
          <p className="screen__empty">Créez d'abord un compte PEA ou CTO dans Comptes.</p>
        )}
      </Section>

      {etat.positionsOrphelines.length > 0 && (
        <Section titre="Positions à rattacher">
          {etat.positionsOrphelines.map((position) => (
            <PositionOrpheline key={position.id} position={position} comptes={comptesTitres} />
          ))}
        </Section>
      )}

      <Section titre="Ma watchlist">
        {etat.watchlist.map((suivi) => (
          <Row
            key={suivi.id}
            libelle={`${suivi.favori ? '★ ' : ''}${suivi.ticker}`}
            sousLibelle={[suivi.libelle, suivi.conviction, suivi.horizon].filter(Boolean).join(' · ')}
          >
            {comptesTitres.length > 0 && (
              <button className="bourse__promouvoir" onClick={() => setSheet({ mode: 'promotion', suivi })}>
                Promouvoir
              </button>
            )}
            <button
              className="comptes__gerer"
              aria-label="Gérer le suivi"
              onClick={() => setSheet({ mode: 'suivi', suivi })}
            >
              ⋯
            </button>
          </Row>
        ))}
        <button className="bourse__ajouter" onClick={() => setSheet({ mode: 'nouveau-suivi' })}>
          + Ajouter à la watchlist
        </button>
      </Section>

      <Sheet titre={sheet ? TITRES_SHEET[sheet.mode] : ''} ouvert={sheet !== null} onFermer={() => setSheet(null)}>
        {sheet && (
          <FormulaireBourse
            sheet={sheet}
            comptes={comptesTitres}
            quotes={etat.quotes}
            onFermer={() => setSheet(null)}
          />
        )}
      </Sheet>
    </Screen>
  )
}

/** Position sans compte valide (accountId vide, ou compte supprimé lors d'un
 * import) : ne s'affiche nulle part ailleurs tant qu'elle n'est pas résolue
 * par l'utilisateur — rattachée à un compte, ou supprimée explicitement. */
function PositionOrpheline({ position, comptes }) {
  const [accountId, setAccountId] = useState(comptes[0]?.id ?? '')
  const [confirmation, setConfirmation] = useState(false)

  return (
    <Row
      libelle={position.ticker}
      sousLibelle={`${position.quantite} × ${formatDevise(position.pru, position.devise)}`}
    >
      {comptes.length > 0 && (
        <>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {comptes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.libelle}
              </option>
            ))}
          </select>
          <button className="bourse__promouvoir" onClick={() => rattacherPositionOrpheline(position.id, accountId)}>
            Rattacher
          </button>
        </>
      )}
      {confirmation ? (
        <button
          type="button"
          className="comptes__supprimer comptes__supprimer--confirme"
          onClick={() => supprimerPositionOrpheline(position.id)}
        >
          Confirmer
        </button>
      ) : (
        <button type="button" className="comptes__supprimer" onClick={() => setConfirmation(true)}>
          Supprimer
        </button>
      )}
    </Row>
  )
}
