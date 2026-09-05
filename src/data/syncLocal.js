// Trois clés localStorage, toutes distinctes de `vv.state` : jamais dans un
// export JSON (texteExport() ne sérialise que l'état du store), jamais
// effacées par un import (remplacerEtat() ne touche que ce même état).
// Cf. CLAUDE.md § « Sécurité ».
const CLE_JETON = 'vv.jeton'
const CLE_DERNIERE_SYNC = 'vv.sync.derniereReussie'
const CLE_CLE_CHIFFREMENT = 'vv.cleChiffrement'

export function chargerJeton() {
  return window.localStorage.getItem(CLE_JETON) ?? ''
}

export function sauvegarderJeton(jeton) {
  window.localStorage.setItem(CLE_JETON, jeton)
}

/** Horodatage ISO de la dernière synchro réussie, ou null si jamais. */
export function chargerDerniereSync() {
  return window.localStorage.getItem(CLE_DERNIERE_SYNC)
}

export function sauvegarderDerniereSync(horodatage) {
  window.localStorage.setItem(CLE_DERNIERE_SYNC, horodatage)
}

// La clé dérivée (JWK), jamais la phrase secrète en clair — cf. src/lib/crypto.js.
export function chargerCleChiffrement() {
  const brut = window.localStorage.getItem(CLE_CLE_CHIFFREMENT)
  return brut ? JSON.parse(brut) : null
}

export function sauvegarderCleChiffrement(jwk) {
  window.localStorage.setItem(CLE_CLE_CHIFFREMENT, JSON.stringify(jwk))
}

export function oublierCleChiffrement() {
  window.localStorage.removeItem(CLE_CLE_CHIFFREMENT)
}
