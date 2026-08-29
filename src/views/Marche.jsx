import Screen from '../components/Screen.jsx'

export default function Marche() {
  return (
    <Screen title="Marché" subtitle="Indicateurs suivis, hors patrimoine">
      <p className="screen__empty">
        Le cours du BTC, suivi comme indicateur et jamais compté dans le
        patrimoine, arrivera en phase 3.
      </p>
    </Screen>
  )
}
