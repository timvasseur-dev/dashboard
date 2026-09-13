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

  // L'instantané du jour s'écrit après le rafraîchissement et seulement s'il a
  // abouti : figer un total, c'est figer les cours qui l'ont produit.
  useEffect(() => {
    rafraichirAuDemarrage().then((reussi) => {
      if (reussi) enregistrerInstantaneAutomatique()
    })
    verifierSynchronisation()
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
