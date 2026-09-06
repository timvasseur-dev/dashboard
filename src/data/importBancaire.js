import { decoderTexte } from '../lib/encodageCsv.js'
import { decouperLignes } from '../lib/csv.js'
import { analyserFichier } from '../lib/importBancaire.js'
import { calculerImport } from '../lib/dedoublonnage.js'
import { etatCourant, ajouterTransactions } from './store.js'

/**
 * Lit et analyse un fichier CSV bancaire, sans toucher au store : l'appelant
 * affiche l'aperçu (nouveau / doublon / erreur) et ne confirme qu'ensuite
 * (cf. `confirmerImport`).
 */
export async function previsualiserImport({ file, profil, accountId, devise }) {
  const octets = new Uint8Array(await file.arrayBuffer())
  const { texte, encodage } = decoderTexte(octets)
  const lignes = decouperLignes(texte)

  const { transactions, erreurs } = analyserFichier({ lignes, profil, accountId, devise })
  const { aInserer, doublons } = calculerImport(etatCourant().transactions, transactions)

  return { aInserer, doublons, erreurs, encodage }
}

/** Écrit l'aperçu confirmé, en une seule fois : soit tout, soit rien. */
export function confirmerImport(aInserer) {
  ajouterTransactions(aInserer)
}
