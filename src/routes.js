import Patrimoine from './views/Patrimoine.jsx'
import Comptes from './views/Comptes.jsx'
import Bourse from './views/Bourse.jsx'
import Marche from './views/Marche.jsx'
import Reglages from './views/Reglages.jsx'
import MouvementsCompte from './views/MouvementsCompte.jsx'
import ImportCsv from './views/ImportCsv.jsx'
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

// Écrans de détail hors-onglets : atteints depuis Comptes, pas depuis la
// barre d'onglets. L'onglet Comptes reste actif visuellement (cf. resolveRoute).
const routesDetail = [
  { motif: /^\/comptes\/[^/]+\/mouvements$/, view: MouvementsCompte },
  { motif: /^\/comptes\/[^/]+\/import$/, view: ImportCsv },
]

/** Route correspondant au chemin, avec repli sur Patrimoine si inconnu. */
export function resolveRoute(path) {
  const exacte = routes.find((route) => route.path === path)
  if (exacte) return exacte

  const detail = routesDetail.find((route) => route.motif.test(path))
  if (detail) return { ...routes[1], view: detail.view }

  return routes[0]
}
