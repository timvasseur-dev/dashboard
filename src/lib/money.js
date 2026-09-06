// Taux fixe, jamais réseau (cf. CLAUDE.md § 3).
export const XPF_PAR_EUR = 119.3317

/** Convertit un montant vers l'euro. `tauxUsd` (EUR pour 1 USD) est requis
 * pour les montants en USD ; sans lui, le résultat est `null`. */
export function versEur(montant, devise, tauxUsd) {
  switch (devise) {
    case 'EUR':
      return montant
    case 'XPF':
      return montant / XPF_PAR_EUR
    case 'USD':
      return tauxUsd ? montant * tauxUsd : null
    default:
      return null
  }
}

const formatteurEur = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
})

const formatteurs = {
  EUR: formatteurEur,
  USD: new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }),
  XPF: new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XPF',
    maximumFractionDigits: 0,
  }),
}

export function formatEur(montant) {
  return formatteurEur.format(montant)
}

export function formatDevise(montant, devise) {
  const formatteur = formatteurs[devise]
  return formatteur ? formatteur.format(montant) : `${montant} ${devise}`
}

// `\s` couvre aussi l'espace insécable (U+00A0) et l'insécable fine (U+202F)
// en JavaScript : les formes vues comme séparateur de milliers dans de vrais
// exports bancaires.
const ESPACES_MILLIERS = /\s/g

/** Parse un montant au format français (« 1 234,56 », insécables comprises)
 * en nombre. `null` si la chaîne est vide (colonne débit ou crédit non
 * renseignée sur la ligne). */
export function parseMontantFr(chaine) {
  const nettoye = (chaine ?? '').trim()
  if (nettoye === '') return null
  const nombre = Number(nettoye.replace(ESPACES_MILLIERS, '').replace(',', '.'))
  return Number.isNaN(nombre) ? null : nombre
}
