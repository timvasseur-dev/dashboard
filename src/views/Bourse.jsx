import { useState } from 'react'
import Screen from '../components/Screen.jsx'
import Section from '../components/Section.jsx'
import Row from '../components/Row.jsx'
import Sheet from '../components/Sheet.jsx'
import { useEtat } from '../data/store.js'
import { valoriserPosition } from '../lib/portfolio.js'
import { formatEur, formatDevise } from '../lib/money.js'
import FormulaireBourse from './BourseFormulaire.jsx'
import './Bourse.css'

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
        {etat.watchlist.map((suivi) => (
          <Row
            key={suivi.id}
            libelle={`${suivi.favori ? '★ ' : ''}${suivi.ticker}`}
            sousLibelle={[suivi.libelle, suivi.conviction, suivi.horizon].filter(Boolean).join(' · ')}
          >
            <button className="bourse__promouvoir" onClick={() => setSheet({ mode: 'promotion', suivi })}>
              Promouvoir
            </button>
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
