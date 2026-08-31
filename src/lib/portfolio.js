import { versEur } from './money.js'

/**
 * Valorise une position au cours donné. `cours` est l'entrée `quotes[ticker]`,
 * ou undefined si aucun cours n'a été saisi — dans ce cas la position ne vaut
 * pas zéro, elle est simplement sans valeur connue.
 */
export function valoriserPosition(position, cours, tauxUsd) {
  const coutRevient = position.quantite * position.pru

  if (!cours) {
    return { valeur: null, valeurEur: null, coutRevient, coutRevientEur: null, plusValueEur: null, tauxUtilise: null }
  }

  const valeur = position.quantite * cours.prix
  const valeurEur = versEur(valeur, cours.devise, tauxUsd)
  const coutRevientEur = versEur(coutRevient, position.devise, tauxUsd)

  return {
    valeur,
    valeurEur,
    coutRevient,
    coutRevientEur,
    plusValueEur: valeurEur !== null && coutRevientEur !== null ? valeurEur - coutRevientEur : null,
    tauxUtilise: cours.devise === 'USD' ? tauxUsd : null,
  }
}

// Classe d'actif par type de compte, au critère de disponibilité (cf. CLAUDE.md
// § 3) : un PEA/CTO n'est pas mobilisable comme un compte courant, son cash
// non investi est donc rangé avec les titres, pas avec le cash disponible.
const CLASSE_PAR_TYPE = { courant: 'cash', epargne: 'epargne', pea: 'titres', cto: 'titres' }

/**
 * Consolide tout le patrimoine en euros : comptes + positions valorisées.
 * Une position sans cours saisi est exclue du total plutôt que comptée pour
 * zéro (`coursManquants`), mais reste présente dans `positionsTitres` /
 * `positionsParInstitution` pour l'affichage du détail.
 *
 * Ne prend jamais l'état complet en paramètre, seulement ce sous-ensemble :
 * `watchlist` n'y figure pas, ni dans la signature ni dans les appels
 * (cf. Patrimoine.jsx). Une ligne de watchlist est une idée de suivi, sans
 * quantité ni PRU ni cours stocké — elle ne peut structurellement rien
 * valoir. Ne pas élargir la déstructuration ci-dessous pour y accéder ; si un
 * besoin d'affichage watchlist apparaît, il se lit depuis `etat.watchlist`
 * en dehors de cette fonction, jamais dedans.
 */
export function consolider({ institutions, accounts, balances, positions, quotes, fx }) {
  const tauxUsd = fx['USD/EUR']?.taux ?? null

  let totalEur = 0
  let plusValueEur = 0
  const parInstitution = {}
  const parClasse = { cash: 0, epargne: 0, titres: 0 }
  const coursManquants = []

  // Détail dépliable, par axe (institution ou classe) — cf. écran Patrimoine.
  const comptesParInstitution = {}
  const positionsParInstitution = {}
  const positionsTitres = []
  const comptesCash = []
  const comptesEpargne = []
  const comptesEnveloppe = [] // cash logé dans un PEA/CTO, détail de la classe "Titres"

  const compteDe = (accountId) => accounts.find((c) => c.id === accountId)
  const institutionDe = (accountId) => compteDe(accountId)?.institutionId ?? null

  const ajouter = (institutionId, classe, montantEur) => {
    if (montantEur === null) return
    totalEur += montantEur
    parClasse[classe] += montantEur
    if (institutionId) {
      parInstitution[institutionId] = (parInstitution[institutionId] ?? 0) + montantEur
    }
  }

  for (const compte of accounts) {
    const solde = balances[compte.id]
    if (!solde) continue
    const montantEur = versEur(solde.montant, compte.devise, tauxUsd)
    const classe = CLASSE_PAR_TYPE[compte.type]
    ajouter(compte.institutionId, classe, montantEur)

    const ligne = { compte, montant: solde.montant, montantEur }
    ;(comptesParInstitution[compte.institutionId] ??= []).push(ligne)
    if (classe === 'cash') comptesCash.push(ligne)
    else if (classe === 'epargne') comptesEpargne.push(ligne)
    else comptesEnveloppe.push(ligne)
  }

  for (const position of positions) {
    const compte = compteDe(position.accountId)
    const institutionId = institutionDe(position.accountId)
    const cours = quotes[position.ticker]
    const { valeurEur, plusValueEur: pvEur } = valoriserPosition(position, cours, tauxUsd)

    const ligne = { position, compte, valeurEur, plusValueEur: pvEur, coursManquant: valeurEur === null }
    positionsTitres.push(ligne)
    if (institutionId) {
      ;(positionsParInstitution[institutionId] ??= []).push(ligne)
    }

    if (valeurEur === null) {
      coursManquants.push(position)
      continue
    }
    ajouter(institutionId, 'titres', valeurEur)
    if (pvEur !== null) plusValueEur += pvEur
  }

  return {
    totalEur,
    parInstitution,
    parClasse,
    plusValueEur,
    tauxUtilise: tauxUsd,
    coursManquants,
    comptesParInstitution,
    positionsParInstitution,
    positionsTitres,
    comptesCash,
    comptesEpargne,
    comptesEnveloppe,
  }
}
