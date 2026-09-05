import { VERSION, etatVide } from './schema.js'
import { migrer } from './migrations.js'

const CLE = 'vv.state'

/** Lit l'état persisté. JSON illisible ou localStorage indisponible (navigation
 * privée) : on démarre sur un état vide plutôt que sur un écran blanc. */
export function charger() {
  try {
    const brut = window.localStorage.getItem(CLE)
    if (!brut) return etatVide()
    return migrer(JSON.parse(brut), VERSION)
  } catch {
    return etatVide()
  }
}

export function sauvegarder(etat) {
  try {
    window.localStorage.setItem(CLE, JSON.stringify(etat))
  } catch {
    // quota dépassé ou localStorage indisponible : la mutation reste en mémoire
  }
}

const CLES_ATTENDUES = [
  'version',
  'institutions',
  'accounts',
  'balances',
  'positions',
  'positionsOrphelines',
  'watchlist',
  'quotes',
  'fx',
  'historique',
  'dernierModification',
  'appareilId',
]

/** Vérifie la forme d'un état avant de l'appliquer (import JSON). */
export function validerEtatImporte(candidat) {
  if (!candidat || typeof candidat !== 'object') return false
  if (!CLES_ATTENDUES.every((cle) => cle in candidat)) return false

  return (
    typeof candidat.version === 'number' &&
    Array.isArray(candidat.institutions) &&
    Array.isArray(candidat.accounts) &&
    typeof candidat.balances === 'object' &&
    Array.isArray(candidat.positions) &&
    Array.isArray(candidat.positionsOrphelines) &&
    Array.isArray(candidat.watchlist) &&
    typeof candidat.quotes === 'object' &&
    typeof candidat.fx === 'object' &&
    Array.isArray(candidat.historique) &&
    (candidat.dernierModification === null || typeof candidat.dernierModification === 'string') &&
    typeof candidat.appareilId === 'string'
  )
}
