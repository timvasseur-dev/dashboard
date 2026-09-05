// Statut de synchro : éphémère, jamais persisté (même patron que
// src/data/statutRafraichissement.js). `conflit` porte les deux versions en
// jeu quand comparerEtats() a détecté qu'aucune des deux ne peut être
// adoptée sans risque — tant qu'il est non nul, aucune synchro automatique
// ne pousse rien (cf. sync.js).
import { useSyncExternalStore } from 'react'

let statut = { enCours: false, derniereErreur: null, dernierMessage: null, conflit: null }
const listeners = new Set()

function emit() {
  listeners.forEach((listener) => listener())
}

function subscribe(onChange) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

export function useStatutSynchronisation() {
  return useSyncExternalStore(subscribe, () => statut, () => statut)
}

/** Statut courant hors composant (cf. src/data/sync.js). */
export function statutSynchronisationCourant() {
  return statut
}

export function debuterSynchronisation() {
  statut = { ...statut, enCours: true }
  emit()
}

export function terminerSynchronisation(erreur, message) {
  statut = { ...statut, enCours: false, derniereErreur: erreur ?? null, dernierMessage: message ?? null }
  emit()
}

export function definirConflit(conflit) {
  statut = { ...statut, conflit }
  emit()
}

export function effacerConflit() {
  statut = { ...statut, conflit: null }
  emit()
}
