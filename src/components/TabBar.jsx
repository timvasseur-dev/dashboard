import { routes } from '../routes.js'
import { navigate } from '../lib/router.js'
import './TabBar.css'

/** Barre d'onglets fixe en bas d'écran, façon application native. */
export default function TabBar({ current }) {
  return (
    <nav className="tabbar" aria-label="Navigation principale">
      {routes.map(({ path, label, icon: Icon }) => {
        const active = path === current
        return (
          <button
            key={path}
            type="button"
            className={'tabbar__item' + (active ? ' tabbar__item--active' : '')}
            aria-current={active ? 'page' : undefined}
            onClick={() => navigate(path)}
          >
            <Icon />
            <span className="tabbar__label">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
