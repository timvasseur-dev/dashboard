// Quel instrument est ouvert dans la modale par titre. État éphémère, jamais
// persisté — ce n'est pas une donnée du patrimoine (même motif que
// statutRafraichissement.js).
//
// Vit ici plutôt que dans une vue parce que la modale s'ouvre depuis
// n'importe quel écran : Patrimoine, Bourse, Marché. Un état partagé évite de
// faire descendre un callback à travers trois niveaux de composants.
import { useSyncExternalStore } from 'react'

let ouvert = null // { ticker, position?, suivi?, libelle? }
const listeners = new Set()

function emit() {
  listeners.forEach((listener) => listener())
}

function subscribe(onChange) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

export function useModaleTitre() {
  return useSyncExternalStore(subscribe, () => ouvert, () => ouvert)
}

/** Ouvre la modale sur un instrument. `cible` porte au moins un `ticker` ; la
 * `position` ou le `suivi` d'origine quand il y en a un, pour afficher ce
 * qu'on détient ou ce qu'on en pense. */
export function ouvrirTitre(cible) {
  ouvert = cible
  emit()
}

export function fermerTitre() {
  ouvert = null
  emit()
}
