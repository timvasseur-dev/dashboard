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

// Classe d'actif par type de compte, au critère de ce qui est investi. Le cash
// non investi d'un PEA ou d'un CTO compte comme du cash, pas comme des titres :
// c'est ce qui fait que « Titres » vaut exactement la valorisation des
// positions, et donc que l'anneau de répartition et les barres de part disent
// quelque chose de vrai. Il reste détaillé à part (`comptesEnveloppe`), parce
// qu'un solde logé dans une enveloppe n'est pas mobilisable comme un compte
// courant — la nuance est affichée, elle n'est plus dans le classement.
const CLASSE_PAR_TYPE = { courant: 'cash', epargne: 'epargne', pea: 'cash', cto: 'cash' }

/**
 * Consolide tout le patrimoine en euros : comptes + positions valorisées.
 * Une position sans cours saisi est exclue du total plutôt que comptée pour
 * zéro (`coursManquants`), mais reste présente dans `positionsTitres` /
 * `positionsParInstitution` pour l'affichage du détail.
 *
 * Deuxième cause d'exclusion, distincte de la première : un montant dont la
 * conversion en euros échoue faute de taux USD/EUR. Il sort du total lui
 * aussi, et il est listé dans `montantsNonConvertis` — sans quoi le cash en
 * dollars du CTO disparaîtrait du total sans un mot, n'étant ni une position
 * ni un cours manquant.
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
  const plusValueParInstitution = {}
  const parClasse = { cash: 0, epargne: 0, titres: 0 }
  const coursManquants = []
  const montantsNonConvertis = []

  // Détail dépliable, par axe (institution ou classe) — cf. écran Patrimoine.
  const comptesParInstitution = {}
  const positionsParInstitution = {}
  const positionsTitres = []
  const comptesCash = []
  const comptesEpargne = []
  const comptesEnveloppe = [] // cash logé dans un PEA/CTO, détail de la classe "Cash"

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
    ajouter(compte.institutionId, CLASSE_PAR_TYPE[compte.type], montantEur)

    if (montantEur === null) {
      montantsNonConvertis.push({ libelle: compte.libelle, devise: compte.devise })
    }

    // Le détail se range par type de compte et non par classe : PEA et CTO
    // comptent désormais dans le cash, mais leur solde reste montré à part.
    const ligne = { compte, montant: solde.montant, montantEur }
    ;(comptesParInstitution[compte.institutionId] ??= []).push(ligne)
    if (compte.type === 'courant') comptesCash.push(ligne)
    else if (compte.type === 'epargne') comptesEpargne.push(ligne)
    else comptesEnveloppe.push(ligne)
  }

  for (const position of positions) {
    const compte = compteDe(position.accountId)
    const institutionId = institutionDe(position.accountId)
    const cours = quotes[position.ticker]
    const { valeurEur, plusValueEur: pvEur } = valoriserPosition(position, cours, tauxUsd)

    // Deux causes d'exclusion à ne pas confondre à l'affichage : pas de cours
    // du tout, ou un cours en dollars qu'aucun taux ne permet de convertir.
    const coursManquant = !cours
    const nonConverti = Boolean(cours) && valeurEur === null

    const ligne = { position, compte, valeurEur, plusValueEur: pvEur, coursManquant, nonConverti }
    positionsTitres.push(ligne)
    if (institutionId) {
      ;(positionsParInstitution[institutionId] ??= []).push(ligne)
    }

    if (coursManquant) {
      coursManquants.push(position)
      continue
    }
    if (nonConverti) {
      montantsNonConvertis.push({ libelle: position.ticker, devise: cours.devise })
      continue
    }
    ajouter(institutionId, 'titres', valeurEur)
    if (pvEur !== null) {
      plusValueEur += pvEur
      if (institutionId) {
        plusValueParInstitution[institutionId] = (plusValueParInstitution[institutionId] ?? 0) + pvEur
      }
    }
  }

  return {
    totalEur,
    parInstitution,
    plusValueParInstitution,
    parClasse,
    plusValueEur,
    tauxUtilise: tauxUsd,
    coursManquants,
    montantsNonConvertis,
    comptesParInstitution,
    positionsParInstitution,
    positionsTitres,
    comptesCash,
    comptesEpargne,
    comptesEnveloppe,
  }
}
