export const VERSION = 3

export const TYPES_COMPTE = ['courant', 'epargne', 'pea', 'cto']
export const DEVISES = ['EUR', 'USD', 'XPF']
export const CONVICTIONS = ['faible', 'moyenne', 'forte']
export const HORIZONS = ['court', 'moyen', 'long']

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
    positionsOrphelines: [],
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
  if (!accountId) throw new Error('creerPosition : accountId requis')
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

/** Une ligne de watchlist est une idée de suivi, jamais un titre valorisable :
 * ni quantité, ni PRU, ni devise, ni cours stocké (cf. CLAUDE.md § 3). */
export function creerSuivi({
  ticker,
  libelle,
  conviction,
  horizon,
  zoneAchatMin,
  zoneAchatMax,
  alertePrix,
  these,
  risques,
  favori,
}) {
  return {
    id: crypto.randomUUID(),
    ticker,
    libelle,
    conviction: conviction ?? '',
    horizon: horizon ?? '',
    zoneAchatMin: zoneAchatMin ?? null,
    zoneAchatMax: zoneAchatMax ?? null,
    alertePrix: alertePrix ?? null,
    these: these ?? '',
    risques: risques ?? '',
    favori: favori ?? false,
  }
}
