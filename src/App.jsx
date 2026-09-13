import { useEffect, useRef } from 'react'
import { useHashRoute } from './lib/router.js'
import { resolveRoute } from './routes.js'
import TabBar from './components/TabBar.jsx'
import ModaleTitre from './views/ModaleTitre.jsx'
import { useEtat } from './data/store.js'
import { rafraichirAuDemarrage } from './data/rafraichissement.js'
import { enregistrerInstantaneAutomatique } from './data/instantaneAuto.js'
import { verifierSynchronisation, programmerPush } from './data/sync.js'

export default function App() {
  const path = useHashRoute()
  const route = resolveRoute(path)
  const View = route.view
  const etat = useEtat()
  const monte = useRef(false)

  // Trois étapes au démarrage, dans cet ordre et jamais en parallèle.
  //
  // La synchro d'abord : elle lit l'état local avant son aller-retour réseau,
  // et peut le remplacer entièrement par l'état distant. Un instantané écrit
  // pendant ce temps serait effacé sans un mot.
  //
  // Le rafraîchissement ensuite, l'instantané en dernier et seulement si le
  // rafraîchissement a abouti : figer un total, c'est figer les cours qui
  // l'ont produit.
  useEffect(() => {
    const demarrer = async () => {
      await verifierSynchronisation()
      if (await rafraichirAuDemarrage()) enregistrerInstantaneAutomatique()
    }
    demarrer()
  }, [])

  // Pousse après chaque modification locale — jamais au montage, où
  // dernierModification reflète une session précédente, pas un changement
  // qui vient d'avoir lieu ici.
  useEffect(() => {
    if (monte.current) programmerPush()
    monte.current = true
  }, [etat.dernierModification])

  return (
    <>
      <View />
      {/* Montée une seule fois : la modale par titre s'ouvre depuis
          n'importe quel écran, sans faire descendre de props. */}
      <ModaleTitre />
      <TabBar current={route.path} />
    </>
  )
}
