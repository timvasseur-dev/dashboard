import { useSyncExternalStore } from 'react'

/*
 * Routeur à hash.
 *
 * GitHub Pages est un serveur de fichiers statiques : une URL /dashboard/comptes
 * ne correspond à aucun fichier et renvoie une 404. Le fragment après « # » n'est
 * jamais envoyé au serveur, donc /dashboard/#/comptes est toujours servi par
 * index.html. Aucune 404 possible, aucune redirection à maintenir.
 */

const listeners = new Set()

function emit() {
  listeners.forEach((listener) => listener())
}

function subscribe(onChange) {
  listeners.add(onChange)
  if (listeners.size === 1) window.addEventListener('hashchange', emit)

  return () => {
    listeners.delete(onChange)
    if (listeners.size === 0) window.removeEventListener('hashchange', emit)
  }
}

function readHash() {
  const raw = window.location.hash.slice(1)
  if (!raw || raw === '/') return '/'
  // pas de barre oblique finale, pour que '/comptes/' et '/comptes' soient un
  return raw.replace(/\/+$/, '') || '/'
}

/** Chemin courant, normalisé. Se met à jour sans rechargement de page. */
export function useHashRoute() {
  return useSyncExternalStore(subscribe, readHash, () => '/')
}

/**
 * Navigue vers un chemin.
 *
 * L'écriture du hash met à jour location de façon synchrone, mais le navigateur
 * ne déclenche hashchange qu'au tour suivant : attendre cet évènement rend le
 * changement d'écran visiblement mou au tap. On notifie donc immédiatement.
 * Le hashchange qui suit produit le même instantané, React ne rend pas deux fois.
 */
export function navigate(path) {
  if (readHash() === path) return
  window.location.hash = path
  emit()
}
