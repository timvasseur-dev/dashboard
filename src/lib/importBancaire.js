import { detecterDelimiteur, parseLigneCsv } from './csv.js'
import { parseMontantFr } from './money.js'
import { parseDateImport } from './date.js'

/** Réduit les espaces multiples et bordures — un libellé bancaire ne doit
 * pas différer d'un import à l'autre pour une simple espace en trop, ce qui
 * casserait le dédoublonnage (cf. `dedoublonnage.js`). */
function normaliserLibelle(libelle) {
  return (libelle ?? '').trim().replace(/\s+/g, ' ')
}

function indexColonne(entetes, nom) {
  return entetes.findIndex((e) => e.trim().toLowerCase() === nom.trim().toLowerCase())
}

/** Résout, pour un profil donné, l'index de chaque colonne configurée dans la
 * ligne d'en-tête réelle du fichier. Lève une erreur claire et nommée si une
 * colonne configurée est introuvable : le profil ne correspond pas à ce
 * fichier, l'import entier doit s'arrêter avant de rien écrire. */
function resoudreColonnes(entetes, colonnes) {
  const resolues = {}
  for (const [role, nom] of Object.entries(colonnes)) {
    const index = indexColonne(entetes, nom)
    if (index === -1) {
      throw new Error(`Colonne « ${nom} » introuvable dans ce fichier — le profil doit être mis à jour.`)
    }
    resolues[role] = index
  }
  return resolues
}

function extraireMontant(champs, colonnes) {
  if ('montant' in colonnes) {
    return parseMontantFr(champs[colonnes.montant])
  }
  const debit = parseMontantFr(champs[colonnes.debit])
  const credit = parseMontantFr(champs[colonnes.credit])
  if (debit !== null) return -Math.abs(debit)
  if (credit !== null) return Math.abs(credit)
  return null
}

/**
 * Analyse les lignes brutes d'un export bancaire selon un profil de
 * correspondance. Ne touche jamais au store : produit des transactions
 * normalisées (sans id — cf. `dedoublonnage.js`) et une liste d'erreurs de
 * ligne, sans jamais faire échouer tout l'import pour une seule ligne
 * illisible. Une colonne configurée absente du fichier, en revanche, arrête
 * tout : le profil ne correspond pas à ce fichier.
 */
export function analyserFichier({ lignes, profil, accountId, devise }) {
  const corps = lignes.slice(profil.ignorerLignesAvant ?? 0)
  if (corps.length === 0) {
    throw new Error('Fichier vide après la ligne de départ configurée.')
  }

  const delimiteur = detecterDelimiteur(corps[0])
  const entetes = parseLigneCsv(corps[0], delimiteur)
  const colonnes = resoudreColonnes(entetes, profil.colonnes)

  const transactions = []
  const erreurs = []

  for (let i = 1; i < corps.length; i++) {
    const numeroLigne = profil.ignorerLignesAvant + i + 1
    const champs = parseLigneCsv(corps[i], delimiteur)

    const date = parseDateImport(champs[colonnes.date], profil.formatDate)
    const libelle = normaliserLibelle(champs[colonnes.libelle])
    const montant = extraireMontant(champs, colonnes)

    if (date === null || montant === null) {
      erreurs.push({ ligne: numeroLigne, message: 'Date ou montant illisible, ligne ignorée.' })
      continue
    }

    transactions.push({ accountId, date, libelle, montant, devise })
  }

  return { transactions, erreurs }
}
