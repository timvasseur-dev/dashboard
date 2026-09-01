import Screen from '../components/Screen.jsx'
import Section from '../components/Section.jsx'
import Row from '../components/Row.jsx'
import Age from '../components/Age.jsx'
import BoutonActualiser from '../components/BoutonActualiser.jsx'
import { useEtat } from '../data/store.js'
import { actualiserMarche, TICKER_BTC } from '../data/rafraichissement.js'
import { formatEur } from '../lib/money.js'
import './Marche.css'

export default function Marche() {
  const etat = useEtat()
  const btc = etat.quotes[TICKER_BTC]
  const tauxUsd = etat.fx['USD/EUR']

  return (
    <Screen title="Marché" subtitle="Indicateurs suivis, hors patrimoine">
      <BoutonActualiser onActualiser={actualiserMarche} />

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
