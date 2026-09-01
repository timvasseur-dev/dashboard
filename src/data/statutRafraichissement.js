// Statut du rafraîchissement réseau : éphémère, jamais persisté (ce n'est
// pas une donnée du patrimoine, elle ne va pas dans vv.state). Même motif
// que src/data/store.js : un Set d'abonnés, emit() après chaque mutation.
import { useSyncExternalStore } from 'react'

let statut = { enCours: false, derniereErreur: null }
const listeners = new Set()

function emit() {
  listeners.forEach((listener) => listener())
}

function subscribe(onChange) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

export function useStatutRafraichissement() {
  return useSyncExternalStore(subscribe, () => statut, () => statut)
}

export function debuterRafraichissement() {
  statut = { enCours: true, derniereErreur: null }
  emit()
}

export function terminerRafraichissement(erreur) {
  statut = { enCours: false, derniereErreur: erreur ?? null }
  emit()
}
