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
