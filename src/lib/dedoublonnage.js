/**
 * Dédoublonnage des transactions importées (cf. CLAUDE.md § phase 5 : point
 * critique, ré-imports de fichiers qui se chevauchent).
 *
 * Clé de base : compte + date + montant (en centimes, jamais en flottant) +
 * libellé normalisé. Deux lignes identiques (deux achats au même montant le
 * même jour) ne sont pas un doublon automatique : elles sont traitées comme
 * un multiset — la n-ième occurrence d'une clé dans le fichier importé n'est
 * un doublon que si l'historique en contient déjà au moins n.
 *
 * Limite assumée : ceci suppose que les lignes partageant une même clé
 * gardent le même ordre relatif d'un export à l'autre (vrai en pratique, les
 * relevés bancaires sont chronologiques) ; un arrondi de centime qui
 * différerait entre deux exports d'une même opération ferait manquer un
 * doublon réel. L'aperçu avant validation (compteurs nouveau/doublon) permet
 * de repérer une anomalie grossière avant de confirmer.
 */
function centimes(montant) {
  return Math.round(montant * 100)
}

function cleBase(transaction) {
  return `${transaction.accountId}|${transaction.date}|${centimes(transaction.montant)}|${transaction.libelle}`
}

/** Calcule, pour un lot de transactions fraîchement analysées, celles à
 * insérer (avec leur id définitif) et celles à ignorer comme doublons.
 * `transactionsExistantes` est l'historique déjà présent dans l'état. */
export function calculerImport(transactionsExistantes, transactionsBrutes) {
  const occurrencesExistantes = new Map()
  for (const transaction of transactionsExistantes) {
    const cle = cleBase(transaction)
    occurrencesExistantes.set(cle, (occurrencesExistantes.get(cle) ?? 0) + 1)
  }

  const occurrencesLot = new Map()
  const aInserer = []
  const doublons = []

  for (const brute of transactionsBrutes) {
    const cle = cleBase(brute)
    const rang = occurrencesLot.get(cle) ?? 0
    occurrencesLot.set(cle, rang + 1)

    const dejaPresentes = occurrencesExistantes.get(cle) ?? 0
    if (rang < dejaPresentes) {
      doublons.push(brute)
    } else {
      aInserer.push({ ...brute, id: `${cle}#${rang}` })
    }
  }

  return { aInserer, doublons }
}
