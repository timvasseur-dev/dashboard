import { etatCourant, modifierEtat } from './store.js'
import { creerOrdre, creerPosition } from './schema.js'
import { appliquerOrdre, peutAnnuler, annulerOrdre } from '../lib/ordres.js'

/*
 * Ordres exécutés (phase 7), à part de store.js pour qu'il reste sous les
 * 300 lignes. Un ordre et la ligne qu'il modifie s'écrivent dans la même
 * mutation : jamais l'un sans l'autre, ni un ordre enregistré sur une ligne
 * restée telle quelle.
 *
 * Le solde espèces du compte n'est pas touché : il est saisi ou importé,
 * jamais calculé (cf. CLAUDE.md § 3). C'est l'écran qui rappelle de le
 * mettre à jour.
 */

/**
 * Enregistre un ordre et met sa ligne à jour. `positionId` désigne une ligne
 * existante du compte ; sans lui, un achat ouvre une nouvelle ligne à partir
 * de `ticker`, `isin` et `devise`. Lève une erreur lisible si l'ordre est
 * refusé — rien n'est alors écrit.
 */
export function passerOrdre({ accountId, positionId, ticker, isin, devise, sens, date, quantite, cours, frais }) {
  const etat = etatCourant()
  if (!etat.accounts.some((c) => c.id === accountId)) throw new Error('Compte introuvable.')

  let ligne
  if (positionId) {
    ligne = etat.positions.find((p) => p.id === positionId && p.accountId === accountId)
    if (!ligne) throw new Error('Ligne introuvable dans ce compte.')
  } else {
    if (sens !== 'achat') throw new Error('Une vente porte sur une ligne existante.')
    if (etat.positions.some((p) => p.accountId === accountId && p.ticker === ticker)) {
      throw new Error('Cette ligne existe déjà dans ce compte : choisissez-la dans la liste.')
    }
    // Ligne vide, pas encore rangée : l'achat la remplit, et c'est elle qui
    // entre dans l'état.
    ligne = creerPosition({ accountId, ticker, isin, quantite: 0, pru: 0, devise })
  }

  const { photo, position } = appliquerOrdre(ligne, { sens, quantite, cours, frais })
  const ordre = creerOrdre({
    positionId: ligne.id,
    accountId,
    ticker: ligne.ticker,
    isin: ligne.isin,
    devise: ligne.devise,
    sens,
    date,
    quantite,
    cours,
    frais,
    ...photo,
  })

  modifierEtat((courant) => ({
    ...courant,
    positions: remplacerLigne(courant.positions, ligne.id, position),
    ordres: [...courant.ordres, ordre],
  }))
  return ordre
}

/** Annule un ordre et rend à sa ligne l'état d'avant (cf. `peutAnnuler`). */
export function annulerDernierOrdre(id) {
  const etat = etatCourant()
  const ordre = etat.ordres.find((o) => o.id === id)
  if (!ordre || !peutAnnuler(ordre, etat)) throw new Error('Cet ordre ne peut plus être annulé.')

  const actuelle = etat.positions.find((p) => p.id === ordre.positionId)
  const restauree = annulerOrdre(ordre, actuelle)
  modifierEtat((courant) => ({
    ...courant,
    positions: remplacerLigne(courant.positions, ordre.positionId, restauree),
    ordres: courant.ordres.filter((o) => o.id !== id),
  }))
}

/** Remplace une ligne à sa place, l'ajoute en fin si elle est nouvelle, la
 * retire si elle vaut `null` : l'ordre d'affichage des positions ne bouge pas
 * à chaque ordre. */
function remplacerLigne(positions, id, ligne) {
  if (!positions.some((p) => p.id === id)) return ligne ? [...positions, ligne] : positions
  return ligne ? positions.map((p) => (p.id === id ? ligne : p)) : positions.filter((p) => p.id !== id)
}
