export const VERSION = 5

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

/** État vide de départ, institutions déjà en place. `appareilId` identifie ce
 * navigateur pour la synchronisation (phase 4) : assigné une fois, jamais
 * recréé ensuite, y compris après un import (cf. `remplacerEtat`). */
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
    transactions: [],
    profilsImport: [],
    dernierModification: null,
    appareilId: crypto.randomUUID(),
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

/** Une transaction importée. `id` n'est pas un UUID aléatoire comme les autres
 * entités : c'est la clé de dédoublonnage elle-même (cf. `lib/dedoublonnage.js`),
 * construite par l'import à partir du compte, de la date, du montant et du
 * libellé. Elle sert aussi de test de présence (« déjà importée ? ») sans index
 * séparé — même esprit que l'écart assumé pour `positionsOrphelines`. */
export function creerTransaction({ id, accountId, date, libelle, montant, devise }) {
  if (!id) throw new Error('creerTransaction : id requis')
  if (!accountId) throw new Error('creerTransaction : accountId requis')
  return { id, accountId, date, libelle, montant: Number(montant), devise }
}

/** Un profil de correspondance CSV, réglé une fois par forme de fichier
 * bancaire. Le délimiteur et l'encodage ne sont volontairement pas stockés
 * ici : ils sont redétectés à chaque import (cf. `lib/csv.js`,
 * `lib/encodageCsv.js`), deux exports de la même banque n'ayant pas
 * nécessairement le même encodage. `colonnes` est soit
 * `{ date, libelle, montant }` soit `{ date, libelle, debit, credit }`, les
 * clés étant les noms d'en-tête tels qu'ils apparaissent dans le fichier. */
export function creerProfilImport({
  id,
  institutionId,
  nom,
  ignorerLignesAvant,
  formatDate,
  colonnes,
}) {
  if (!institutionId) throw new Error('creerProfilImport : institutionId requis')
  return {
    id: id ?? crypto.randomUUID(),
    institutionId,
    nom,
    ignorerLignesAvant: ignorerLignesAvant ?? 0,
    formatDate,
    colonnes,
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
