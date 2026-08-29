import Patrimoine from './views/Patrimoine.jsx'
import Comptes from './views/Comptes.jsx'
import Bourse from './views/Bourse.jsx'
import Marche from './views/Marche.jsx'
import Reglages from './views/Reglages.jsx'
import {
  IconPatrimoine,
  IconComptes,
  IconBourse,
  IconMarche,
  IconReglages,
} from './components/icons/TabIcons.jsx'

/*
 * Source unique des onglets : App et TabBar la lisent tous les deux.
 * Ajouter un onglet ne touche que ce fichier.
 */
export const routes = [
  { path: '/', label: 'Patrimoine', view: Patrimoine, icon: IconPatrimoine },
  { path: '/comptes', label: 'Comptes', view: Comptes, icon: IconComptes },
  { path: '/bourse', label: 'Bourse', view: Bourse, icon: IconBourse },
  { path: '/marche', label: 'Marché', view: Marche, icon: IconMarche },
  { path: '/reglages', label: 'Réglages', view: Reglages, icon: IconReglages },
]

/** Route correspondant au chemin, avec repli sur Patrimoine si inconnu. */
export function resolveRoute(path) {
  return routes.find((route) => route.path === path) ?? routes[0]
}
