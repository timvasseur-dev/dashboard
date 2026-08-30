import { versEur } from './money.js'

/**
 * Valorise une position au cours donné. `cours` est l'entrée `quotes[ticker]`,
 * ou undefined si aucun cours n'a été saisi — dans ce cas la position ne vaut
 * pas zéro, elle est simplement sans valeur connue.
 */
export function valoriserPosition(position, cours, tauxUsd) {
  const coutRevient = position.quantite * position.pru

  if (!cours) {
    return { valeur: null, valeurEur: null, coutRevient, plusValueEur: null, tauxUtilise: null }
  }

  const valeur = position.quantite * cours.prix
  const valeurEur = versEur(valeur, cours.devise, tauxUsd)
  const coutRevientEur = versEur(coutRevient, position.devise, tauxUsd)

  return {
    valeur,
    valeurEur,
    coutRevient,
    plusValueEur: valeurEur !== null && coutRevientEur !== null ? valeurEur - coutRevientEur : null,
    tauxUtilise: cours.devise === 'USD' ? tauxUsd : null,
  }
}

/**
 * Consolide tout le patrimoine en euros : comptes espèces + positions
 * valorisées. Une position sans cours saisi est exclue du total plutôt que
 * comptée pour zéro (`coursManquants`).
 */
export function consolider(etat) {
  const tauxUsd = etat.fx['USD/EUR']?.taux ?? null

  let totalEur = 0
  let plusValueEur = 0
  const parInstitution = {}
  const parClasse = { especes: 0, titres: 0 }
  const coursManquants = []

  const institutionDe = (accountId) => etat.accounts.find((c) => c.id === accountId)?.institutionId ?? null

  const ajouter = (institutionId, classe, montantEur) => {
    if (montantEur === null) return
    totalEur += montantEur
    parClasse[classe] += montantEur
    if (institutionId) {
      parInstitution[institutionId] = (parInstitution[institutionId] ?? 0) + montantEur
    }
  }

  for (const compte of etat.accounts) {
    const solde = etat.balances[compte.id]
    if (!solde) continue
    ajouter(compte.institutionId, 'especes', versEur(solde.montant, compte.devise, tauxUsd))
  }

  for (const position of etat.positions) {
    const cours = etat.quotes[position.ticker]
    const { valeurEur, plusValueEur: pvEur } = valoriserPosition(position, cours, tauxUsd)
    if (valeurEur === null) {
      coursManquants.push(position)
      continue
    }
    ajouter(institutionDe(position.accountId), 'titres', valeurEur)
    if (pvEur !== null) plusValueEur += pvEur
  }

  return { totalEur, parInstitution, parClasse, plusValueEur, tauxUtilise: tauxUsd, coursManquants }
}
