import { useEffect, useRef } from 'react'
import { useHashRoute } from './lib/router.js'
import { resolveRoute } from './routes.js'
import TabBar from './components/TabBar.jsx'
import { useEtat } from './data/store.js'
import { rafraichirAuDemarrage } from './data/rafraichissement.js'
import { verifierSynchronisation, programmerPush } from './data/sync.js'

export default function App() {
  const path = useHashRoute()
  const route = resolveRoute(path)
  const View = route.view
  const etat = useEtat()
  const monte = useRef(false)

  useEffect(() => {
    rafraichirAuDemarrage()
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
      <TabBar current={route.path} />
    </>
  )
}
