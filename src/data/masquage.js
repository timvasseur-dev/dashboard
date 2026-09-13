// Masquage des montants — l'œil de l'écran Patrimoine. Sert à ouvrir
// l'application en public sans étaler ses chiffres.
//
// Clé localStorage à part, jamais dans `vv.state`, comme le jeton de synchro
// (cf. syncLocal.js) : c'est un réglage d'affichage propre à cet appareil. Le
// ranger dans l'état le ferait voyager dans la synchro chiffrée, et surtout
// marquer `dernierModification` — donc pousser tout l'état vers le cloud à
// chaque clic sur l'œil.
import { useSyncExternalStore } from 'react'

const CLE = 'vv.masquage'

function charger() {
  try {
    return window.localStorage.getItem(CLE) === '1'
  } catch {
    return false
  }
}

let masque = charger()
const listeners = new Set()

function subscribe(onChange) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

export function useMasquage() {
  return useSyncExternalStore(subscribe, () => masque, () => masque)
}

export function basculerMasquage() {
  masque = !masque
  try {
    window.localStorage.setItem(CLE, masque ? '1' : '0')
  } catch {
    // navigation privée : le masquage tient pour la session, sans plus
  }
  listeners.forEach((listener) => listener())
}
