import { useHashRoute } from './lib/router.js'
import { resolveRoute } from './routes.js'
import TabBar from './components/TabBar.jsx'

export default function App() {
  const path = useHashRoute()
  const route = resolveRoute(path)
  const View = route.view

  return (
    <>
      <View />
      <TabBar current={route.path} />
    </>
  )
}
