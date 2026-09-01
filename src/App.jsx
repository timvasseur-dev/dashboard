import { useEffect } from 'react'
import { useHashRoute } from './lib/router.js'
import { resolveRoute } from './routes.js'
import TabBar from './components/TabBar.jsx'
import { rafraichirAuDemarrage } from './data/rafraichissement.js'

export default function App() {
  const path = useHashRoute()
  const route = resolveRoute(path)
  const View = route.view

  useEffect(() => {
    rafraichirAuDemarrage()
  }, [])

  return (
    <>
      <View />
      <TabBar current={route.path} />
    </>
  )
}
