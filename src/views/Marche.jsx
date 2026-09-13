import Screen from '../components/Screen.jsx'
import Section from '../components/Section.jsx'
import Row from '../components/Row.jsx'
import Age from '../components/Age.jsx'
import BoutonActualiser from '../components/BoutonActualiser.jsx'
import { useEtat } from '../data/store.js'
import { actualiserMarche, TICKER_BTC, INDICATEURS, cleMarche } from '../data/rafraichissement.js'
import { formatEur } from '../lib/money.js'
import MarcheIndicateur from './MarcheIndicateur.jsx'
import './Marche.css'

/**
 * Les indicateurs de marché. Rien de ce qui est affiché ici n'entre dans le
 * patrimoine (CLAUDE.md § 4) : ils sont stockés sous un préfixe que
 * `consolider()` ne peut structurellement pas atteindre.
 */
export default function Marche() {
  const etat = useEtat()
  const btc = etat.quotes[TICKER_BTC]
  const tauxUsd = etat.fx['USD/EUR']

  return (
    <Screen title="Marché" subtitle="Indicateurs suivis, hors patrimoine">
      <BoutonActualiser onActualiser={actualiserMarche} />

      <Section titre="Indices et matières premières">
        {INDICATEURS.map((indicateur) => (
          <MarcheIndicateur
            key={indicateur.ticker}
            indicateur={indicateur}
            cours={etat.quotes[cleMarche(indicateur.ticker)]}
          />
        ))}
      </Section>

      <Section titre="Bitcoin">
        <Row libelle="BTC" sousLibelle="Indicateur de marché, jamais compté dans le patrimoine">
          {btc ? (
            <span className="marche__valeur">
              <span className="num">{formatEur(btc.prix)}</span>
              <Age horodatage={btc.horodatage} />
            </span>
          ) : (
            <span className="indisponible">indisponible</span>
          )}
        </Row>
      </Section>

      <Section titre="Taux de change">
        <Row libelle="USD/EUR" sousLibelle="1 USD en euros">
          {tauxUsd ? (
            <span className="marche__valeur">
              <span className="num">{tauxUsd.taux.toFixed(4)}</span>
              <Age horodatage={tauxUsd.horodatage} />
            </span>
          ) : (
            <span className="indisponible">indisponible</span>
          )}
        </Row>
      </Section>
    </Screen>
  )
}
