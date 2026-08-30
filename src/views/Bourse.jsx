import { useState } from 'react'
import Screen from '../components/Screen.jsx'
import Section from '../components/Section.jsx'
import Row from '../components/Row.jsx'
import Sheet from '../components/Sheet.jsx'
import { useEtat, majCours } from '../data/store.js'
import { valoriserPosition } from '../lib/portfolio.js'
import { formatEur, formatDevise } from '../lib/money.js'
import FormulaireBourse from './BourseFormulaire.jsx'
import './Bourse.css'

const TITRES_SHEET = {
  'nouvelle-position': 'Ajouter une position',
  position: 'Modifier la position',
  'nouveau-suivi': 'Ajouter à la watchlist',
  promotion: 'Promouvoir en position',
}

export default function Bourse() {
  const etat = useEtat()
  const [sheet, setSheet] = useState(null)
  const [coursEnEdition, setCoursEnEdition] = useState(null) // ticker
  const tauxUsd = etat.fx['USD/EUR']?.taux ?? null

  const comptesTitres = etat.accounts.filter((c) => c.type === 'pea' || c.type === 'cto')

  const validerCours = (ticker, devise) => (e) => {
    majCours(ticker, Number(e.target.value.replace(',', '.')) || 0, devise)
    setCoursEnEdition(null)
  }

  return (
    <Screen title="Bourse" subtitle="Positions PEA et CTO">
      <Section titre="Mes positions">
        {comptesTitres.flatMap((compte) =>
          etat.positions
            .filter((p) => p.accountId === compte.id)
            .map((position) => {
              const cours = etat.quotes[position.ticker]
              const { valeurEur, plusValueEur } = valoriserPosition(position, cours, tauxUsd)
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
                      <span className="num">{formatEur(valeurEur)}</span>
                      {plusValueEur !== null && (
                        <span
                          className={`num bourse__pv ${plusValueEur >= 0 ? 'bourse__pv--pos' : 'bourse__pv--neg'}`}
                        >
                          {plusValueEur >= 0 ? '+' : ''}
                          {formatEur(plusValueEur)}
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
        <button className="bourse__ajouter" onClick={() => setSheet({ mode: 'nouvelle-position' })}>
          + Ajouter une position
        </button>
      </Section>

      <Section titre="Ma watchlist">
        {etat.watchlist.map((suivi) => {
          const cours = etat.quotes[suivi.ticker]
          return (
            <Row key={suivi.id} libelle={suivi.ticker} sousLibelle={suivi.libelle}>
              {coursEnEdition === suivi.ticker ? (
                <input
                  className="bourse__saisie-cours num"
                  inputMode="decimal"
                  autoFocus
                  defaultValue={cours?.prix ?? ''}
                  onFocus={(e) => e.target.select()}
                  onBlur={validerCours(suivi.ticker, suivi.devise)}
                  onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                />
              ) : (
                <button className="bourse__cours num" onClick={() => setCoursEnEdition(suivi.ticker)}>
                  {cours ? formatDevise(cours.prix, suivi.devise) : '— saisir'}
                </button>
              )}
              <button className="bourse__promouvoir" onClick={() => setSheet({ mode: 'promotion', suivi })}>
                Promouvoir
              </button>
            </Row>
          )
        })}
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
