export const VERSION = 1

export const TYPES_COMPTE = ['courant', 'epargne', 'pea', 'cto']
export const DEVISES = ['EUR', 'USD', 'XPF']

// Institutions réelles, structure fixe (cf. CLAUDE.md § 3) : pas de gestion en
// phase 2, seuls les comptes qu'elles contiennent se créent et se suppriment.
const INSTITUTIONS_PAR_DEFAUT = [
  { nom: 'BCI', couleur: '#4c8dff' },
  { nom: 'Boursobank', couleur: '#ffa94d' },
  { nom: "Caisse d'Épargne", couleur: '#845ef7' },
  { nom: 'IBKR', couleur: '#20c997' },
]

/** État vide de départ, institutions déjà en place. */
export function etatVide() {
  return {
    version: VERSION,
    institutions: INSTITUTIONS_PAR_DEFAUT.map((institution) => ({
      id: crypto.randomUUID(),
      ...institution,
    })),
    accounts: [],
    balances: {},
    positions: [],
    watchlist: [],
    quotes: {},
    fx: {},
    historique: [],
  }
}

export function creerCompte({ institutionId, libelle, type, devise }) {
  return { id: crypto.randomUUID(), institutionId, libelle, type, devise }
}

export function creerPosition({ accountId, ticker, isin, quantite, pru, devise }) {
  return {
    id: crypto.randomUUID(),
    accountId,
    ticker,
    isin,
    quantite: Number(quantite),
    pru: Number(pru),
    devise,
  }
}

export function creerSuivi({ ticker, libelle, devise, note }) {
  return { id: crypto.randomUUID(), ticker, libelle, devise, note: note ?? '' }
}
