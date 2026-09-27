import { versEur } from './money.js'

/*
 * Ordres exécutés (phase 7) : ce qu'un achat ou une vente fait à une
 * position, et la plus-value réalisée qui en découle. Pur, aucune I/O.
 *
 * Méthode : prix moyen pondéré (PMP), dans la devise de la position. Un achat
 * fond son coût, frais compris, dans le prix de revient ; une vente ne touche
 * pas au prix de revient, elle en fixe l'écart avec le cours obtenu. Pour une
 * position en dollars, la plus-value reste en dollars — ce n'est pas un
 * calcul fiscal, qui demanderait le taux USD/EUR du jour de chaque ordre.
 *
 * Les ordres s'appliquent dans l'ordre où ils sont saisis, pas dans l'ordre
 * de leurs dates : chaque ordre photographie la position telle qu'elle est au
 * moment de la saisie (`quantiteAvant`, `pruAvant`). Un ordre antidaté prend
 * donc le PRU du moment, pas celui qui valait à sa date. Limite assumée : on
 * saisit ses ordres au fil de l'eau, quelques fois par an.
 */

// Quantités fractionnaires (IBKR) et PRU recalculés : une égalité stricte
// entre flottants échouerait sur des valeurs qui se valent.
const TOLERANCE = 1e-9

function egal(a, b) {
  return Math.abs(a - b) <= TOLERANCE * Math.max(1, Math.abs(a), Math.abs(b))
}

// Une quantité s'affiche brute : sans arrondi, 0,1 + 0,2 titre en donnerait
// 0,30000000000000004. Huit décimales couvrent largement le fractionnaire.
function arrondirQuantite(quantite) {
  return Math.round(quantite * 1e8) / 1e8
}

/** Première raison de refuser un ordre sur cette position, ou `null`.
 * `position` est la ligne telle qu'elle est avant l'ordre — quantité 0 pour
 * une ligne qui n'existe pas encore. */
export function erreurOrdre(position, { sens, quantite, cours, frais }) {
  if (!Number.isFinite(quantite) || quantite <= 0) return 'La quantité doit être supérieure à zéro.'
  if (!Number.isFinite(cours) || cours <= 0) return 'Le cours doit être supérieur à zéro.'
  if (!Number.isFinite(frais) || frais < 0) return 'Les frais ne peuvent pas être négatifs.'
  if (sens === 'vente' && quantite > position.quantite && !egal(quantite, position.quantite)) {
    return 'Vente supérieure à la quantité détenue.'
  }
  return null
}

/** Quantité et PRU de la ligne juste après l'ordre, déduits de l'ordre seul.
 * Une quantité nulle veut dire la ligne soldée. */
export function apresOrdre({ sens, quantite, cours, frais, quantiteAvant, pruAvant }) {
  if (sens === 'vente') {
    const reste = quantiteAvant - quantite
    return { quantite: egal(reste, 0) ? 0 : arrondirQuantite(reste), pru: pruAvant }
  }
  const total = quantiteAvant + quantite
  return { quantite: arrondirQuantite(total), pru: (quantiteAvant * pruAvant + quantite * cours + frais) / total }
}

/**
 * Applique un ordre à une position. Renvoie la photo à ranger sur l'ordre et
 * la position qui en résulte — `null` si la vente la solde. Lève une erreur
 * lisible si l'ordre est refusé.
 */
export function appliquerOrdre(position, { sens, quantite, cours, frais }) {
  const erreur = erreurOrdre(position, { sens, quantite, cours, frais })
  if (erreur) throw new Error(erreur)

  const photo = { quantiteAvant: position.quantite, pruAvant: position.pru }
  const apres = apresOrdre({ sens, quantite, cours, frais, ...photo })
  return { photo, position: apres.quantite > 0 ? { ...position, ...apres } : null }
}

/** Plus-value réalisée par une vente, frais déduits, dans la devise de
 * l'ordre. `null` pour un achat, qui ne réalise rien. */
export function plusValueRealisee(ordre) {
  if (ordre.sens !== 'vente') return null
  return ordre.quantite * (ordre.cours - ordre.pruAvant) - ordre.frais
}

/**
 * Un ordre ne s'annule que s'il est le dernier saisi sur sa ligne, et que la
 * ligne est encore exactement dans l'état qu'il a produit. Sans ce second
 * garde-fou, annuler écraserait une correction faite à la main entre-temps
 * dans le formulaire de position.
 */
export function peutAnnuler(ordre, { ordres, positions, accounts }) {
  const dernier = ordres.filter((o) => o.positionId === ordre.positionId).at(-1)
  if (dernier?.id !== ordre.id) return false
  if (!accounts.some((c) => c.id === ordre.accountId)) return false

  const attendu = apresOrdre(ordre)
  const position = positions.find((p) => p.id === ordre.positionId)
  if (attendu.quantite === 0) return !position
  return Boolean(position) && egal(position.quantite, attendu.quantite) && egal(position.pru, attendu.pru)
}

/** La ligne telle qu'elle était avant l'ordre, ou `null` si c'est lui qui
 * l'avait ouverte. Une ligne soldée est recréée sous son identifiant
 * d'origine, à partir de ce que l'ordre en a gardé. */
export function annulerOrdre(ordre, positionActuelle) {
  if (ordre.quantiteAvant === 0) return null
  const base = positionActuelle ?? {
    id: ordre.positionId,
    accountId: ordre.accountId,
    ticker: ordre.ticker,
    isin: ordre.isin,
    devise: ordre.devise,
  }
  return { ...base, quantite: ordre.quantiteAvant, pru: ordre.pruAvant }
}

/** Ordres du plus récent au plus ancien. À date égale, le dernier saisi
 * passe devant : c'est l'ordre dans lequel ils ont été appliqués. */
export function ordresRecents(ordres) {
  return ordres
    .map((ordre, rang) => ({ ordre, rang }))
    .sort((a, b) => b.ordre.date.localeCompare(a.ordre.date) || b.rang - a.rang)
    .map(({ ordre }) => ordre)
}

/**
 * Plus-values réalisées, par année civile de la vente, de la plus récente à
 * la plus ancienne. Chaque devise reste à part (`parDevise`) ; `totalEur`
 * les additionne au taux USD/EUR courant, à titre indicatif. Si une devise ne
 * peut pas être convertie faute de taux, `totalEur` vaut `null` plutôt
 * qu'un total amputé qui passerait pour juste.
 */
export function plusValuesParAnnee(ordres, tauxUsd) {
  const parAnnee = new Map()
  for (const ordre of ordres) {
    const plusValue = plusValueRealisee(ordre)
    if (plusValue === null) continue
    const annee = ordre.date.slice(0, 4)
    const parDevise = parAnnee.get(annee) ?? {}
    parDevise[ordre.devise] = (parDevise[ordre.devise] ?? 0) + plusValue
    parAnnee.set(annee, parDevise)
  }

  return [...parAnnee.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([annee, parDevise]) => {
      const convertis = Object.entries(parDevise).map(([devise, montant]) => versEur(montant, devise, tauxUsd))
      const totalEur = convertis.includes(null) ? null : convertis.reduce((somme, montant) => somme + montant, 0)
      return { annee, parDevise, totalEur }
    })
}
