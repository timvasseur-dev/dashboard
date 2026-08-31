import { useSyncExternalStore } from 'react'
import { charger, sauvegarder } from './storage.js'
import { creerCompte, creerPosition, creerSuivi, VERSION } from './schema.js'
import { migrer } from './migrations.js'
import { jeuDemo } from './demo.js'

/*
 * Store maison, même motif que src/lib/router.js : un Set d'abonnés, emit()
 * après chaque mutation. Écriture dans localStorage à chaque mutation.
 */

let etat = charger()
const listeners = new Set()

function emit() {
  listeners.forEach((listener) => listener())
}

function subscribe(onChange) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

function set(prochainEtat) {
  etat = prochainEtat
  sauvegarder(etat)
  emit()
}

/** État courant, mis à jour à chaque mutation. */
export function useEtat() {
  return useSyncExternalStore(subscribe, () => etat, () => etat)
}

/** Remplace tout l'état (import JSON), en le faisant remonter à la version courante. */
export function remplacerEtat(nouvelEtat) {
  set(migrer(nouvelEtat, VERSION))
}

/** Charge le jeu de démonstration à la place des données actuelles. */
export function chargerDemo() {
  const { comptes, balances, positions, watchlist, quotes, fx } = jeuDemo(etat.institutions)
  set({ ...etat, accounts: comptes, balances, positions, positionsOrphelines: [], watchlist, quotes, fx })
}

// --- Comptes ---

export function ajouterCompte({ institutionId, libelle, type, devise }) {
  const compte = creerCompte({ institutionId, libelle, type, devise })
  set({ ...etat, accounts: [...etat.accounts, compte] })
  return compte.id
}

export function modifierCompte(id, changements) {
  set({
    ...etat,
    accounts: etat.accounts.map((c) => (c.id === id ? { ...c, ...changements } : c)),
  })
}

export function supprimerCompte(id) {
  const { [id]: _retire, ...balances } = etat.balances
  set({
    ...etat,
    accounts: etat.accounts.filter((c) => c.id !== id),
    balances,
    positions: etat.positions.filter((p) => p.accountId !== id),
  })
}

export function majSolde(accountId, montant) {
  set({
    ...etat,
    balances: {
      ...etat.balances,
      [accountId]: { montant, date: new Date().toISOString() },
    },
  })
}

// --- Positions ---

function compteExiste(accountId) {
  return etat.accounts.some((c) => c.id === accountId)
}

export function ajouterPosition(donnees) {
  if (!compteExiste(donnees.accountId)) {
    throw new Error('ajouterPosition : compte introuvable')
  }
  const position = creerPosition(donnees)
  set({ ...etat, positions: [...etat.positions, position] })
  return position.id
}

export function modifierPosition(id, changements) {
  if ('accountId' in changements && !compteExiste(changements.accountId)) {
    throw new Error('modifierPosition : compte introuvable')
  }
  set({
    ...etat,
    positions: etat.positions.map((p) => (p.id === id ? { ...p, ...changements } : p)),
  })
}

export function supprimerPosition(id) {
  set({ ...etat, positions: etat.positions.filter((p) => p.id !== id) })
}

// --- Positions orphelines (accountId invalide, issues d'une migration) ---

/** Rattache une position orpheline à un compte existant : elle rejoint `positions`. */
export function rattacherPositionOrpheline(id, accountId) {
  if (!compteExiste(accountId)) {
    throw new Error('rattacherPositionOrpheline : compte introuvable')
  }
  const position = etat.positionsOrphelines.find((p) => p.id === id)
  if (!position) return
  set({
    ...etat,
    positionsOrphelines: etat.positionsOrphelines.filter((p) => p.id !== id),
    positions: [...etat.positions, { ...position, accountId }],
  })
}

/** Supprime une position orpheline pour de bon, décision explicite de l'utilisateur. */
export function supprimerPositionOrpheline(id) {
  set({ ...etat, positionsOrphelines: etat.positionsOrphelines.filter((p) => p.id !== id) })
}

// --- Watchlist ---

export function ajouterSuivi(donnees) {
  const suivi = creerSuivi(donnees)
  set({ ...etat, watchlist: [...etat.watchlist, suivi] })
  return suivi.id
}

export function modifierSuivi(id, changements) {
  set({
    ...etat,
    watchlist: etat.watchlist.map((s) => (s.id === id ? { ...s, ...changements } : s)),
  })
}

export function supprimerSuivi(id) {
  set({ ...etat, watchlist: etat.watchlist.filter((s) => s.id !== id) })
}

// --- Cours et taux ---

export function majCours(ticker, prix, devise) {
  set({
    ...etat,
    quotes: {
      ...etat.quotes,
      [ticker]: { prix, devise, horodatage: new Date().toISOString() },
    },
  })
}

/** Retire le cours d'un ticker : absent, distinct d'un cours à zéro. */
export function supprimerCours(ticker) {
  const { [ticker]: _retire, ...quotes } = etat.quotes
  set({ ...etat, quotes })
}

export function majTauxUsd(taux) {
  set({
    ...etat,
    fx: { ...etat.fx, 'USD/EUR': { taux, horodatage: new Date().toISOString() } },
  })
}

// --- Historique ---

/** Ajoute un instantané. Ajout seul : rien d'autre n'écrit ce tableau, jamais réécrit. */
export function enregistrerInstantane({ totalEur, tauxUsd }) {
  set({
    ...etat,
    historique: [...etat.historique, { date: new Date().toISOString(), totalEur, tauxUsd }],
  })
}
