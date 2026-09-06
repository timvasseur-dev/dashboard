// Orchestration de la synchro cloud (phase 4). Même esprit que
// rafraichissement.js : jamais de sondage en boucle, un échec réseau ne
// touche jamais l'état local, et toute décision ambiguë remonte à
// l'utilisateur plutôt que d'être tranchée en silence (cf. CLAUDE.md
// § « Sécurité »).
import { etatCourant, appliquerEtatDistant } from './store.js'
import { lireEtatDistant, ecrireEtatDistant } from './syncApi.js'
import { chargerJeton, chargerDerniereSync, sauvegarderDerniereSync } from './syncLocal.js'
import { obtenirCle } from './cleChiffrement.js'
import { chiffrer, dechiffrer } from '../lib/crypto.js'
import { comparerEtats } from '../lib/conflit.js'
import { consolider } from '../lib/portfolio.js'
import {
  debuterSynchronisation,
  terminerSynchronisation,
  definirConflit,
  effacerConflit,
  definirTotaux,
  statutSynchronisationCourant,
} from './statutSynchronisation.js'

// consolider() ne reçoit jamais l'état complet (cf. CLAUDE.md § 3) : même
// sous-ensemble que celui attendu par sa signature.
function sousEnsemble(etat) {
  const { institutions, accounts, balances, positions, quotes, fx } = etat
  return { institutions, accounts, balances, positions, quotes, fx }
}

function totalConsolideEur(etat) {
  return consolider(sousEnsemble(etat)).totalEur
}

// dernierModification/appareilId restent en clair (nécessaires à comparerEtats
// sans déchiffrement) ; tout le reste de l'état est chiffré côté client, le
// worker ne voit jamais qu'un blob opaque (cf. CLAUDE.md § 7).
async function empaqueter(etat) {
  const cle = await obtenirCle()
  if (!cle) throw new Error('phrase secrète non définie sur cet appareil')
  const { dernierModification, appareilId, ...contenu } = etat
  const { iv, blob } = await chiffrer(cle, contenu)
  return { dernierModification, appareilId, iv, blob }
}
async function depaqueter(payload) {
  const cle = await obtenirCle()
  if (!cle) throw new Error('phrase secrète non définie sur cet appareil')
  const contenu = await dechiffrer(cle, payload)
  return { ...contenu, dernierModification: payload.dernierModification, appareilId: payload.appareilId }
}

async function pousser(jeton) {
  if (statutSynchronisationCourant().conflit) {
    throw new Error('conflit non résolu : synchronisation suspendue')
  }
  await ecrireEtatDistant(jeton, await empaqueter(etatCourant()))
  const maintenant = new Date().toISOString()
  sauvegarderDerniereSync(maintenant)
  return maintenant
}

let minuteur = null

/** À appeler après chaque mutation locale : jamais de sondage périodique,
 * juste un court regroupement des rafales (import, saisies successives). */
export function programmerPush() {
  const jeton = chargerJeton()
  if (!jeton) return

  clearTimeout(minuteur)
  minuteur = setTimeout(() => {
    debuterSynchronisation()
    pousser(jeton)
      .then(() => terminerSynchronisation(null, null))
      .catch((erreur) => terminerSynchronisation(erreur.message, null))
  }, 2000)
}

/** Au montage : compare local et distant, et annonce toujours ce qu'elle
 * compte faire — jamais un silence qui masquerait un désaccord. */
export async function verifierSynchronisation() {
  const jeton = chargerJeton()
  if (!jeton) return

  debuterSynchronisation()
  try {
    const local = etatCourant()
    const derniereSyncReussie = chargerDerniereSync()
    const payloadDistant = await lireEtatDistant(jeton)
    const decision = comparerEtats(local, payloadDistant, derniereSyncReussie)
    // Déchiffré une seule fois ici, pour l'affichage des totaux comme pour
    // les branches ci-dessous — jamais un second aller-retour de déchiffrement.
    const distant = payloadDistant ? await depaqueter(payloadDistant) : null
    definirTotaux({ local: totalConsolideEur(local), distant: distant ? totalConsolideEur(distant) : null })

    switch (decision) {
      case 'a-jour':
        terminerSynchronisation(null, null)
        break

      case 'a-pousser':
        terminerSynchronisation(null, 'Modifications locales non encore synchronisées.')
        break

      case 'a-tirer':
        appliquerEtatDistant(distant)
        sauvegarderDerniereSync(distant.dernierModification)
        terminerSynchronisation(null, 'Mis à jour depuis un autre appareil.')
        break

      case 'conflit':
        definirConflit({ local, distant })
        terminerSynchronisation(null, null)
        break
    }
  } catch (erreur) {
    terminerSynchronisation(erreur.message, null)
  }
}

/** Synchro explicite (bouton Réglages) : mêmes règles que verifierSynchronisation,
 * mais pousse aussi quand seul le local a changé (geste explicite cette fois). */
export async function synchroniserMaintenant() {
  const jeton = chargerJeton()
  if (!jeton) throw new Error('aucun jeton enregistré')

  debuterSynchronisation()
  try {
    const local = etatCourant()
    const derniereSyncReussie = chargerDerniereSync()
    const payloadDistant = await lireEtatDistant(jeton)
    const decision = comparerEtats(local, payloadDistant, derniereSyncReussie)
    const distant = payloadDistant ? await depaqueter(payloadDistant) : null
    definirTotaux({ local: totalConsolideEur(local), distant: distant ? totalConsolideEur(distant) : null })

    if (decision === 'conflit') {
      definirConflit({ local, distant })
      terminerSynchronisation(null, null)
      return
    }
    if (decision === 'a-tirer') {
      appliquerEtatDistant(distant)
      sauvegarderDerniereSync(distant.dernierModification)
      terminerSynchronisation(null, 'Mis à jour depuis un autre appareil.')
      return
    }
    await pousser(jeton)
    terminerSynchronisation(null, null)
  } catch (erreur) {
    terminerSynchronisation(erreur.message, null)
  }
}

/** Résolution explicite d'un conflit : l'utilisateur choisit une version
 * entière, jamais de fusion automatique. */
export async function resoudreConflit(choix) {
  const { conflit } = statutSynchronisationCourant()
  if (!conflit) return
  const jeton = chargerJeton()

  effacerConflit()
  if (choix === 'local') {
    await pousser(jeton)
  } else {
    appliquerEtatDistant(conflit.distant)
    sauvegarderDerniereSync(conflit.distant.dernierModification)
  }
}

/** Écrasement manuel, hors détection de conflit : geste de dernier recours
 * (écran Réglages) pour trancher une divergence que l'app n'aurait pas
 * signalée elle-même. `effacerConflit()` lève la garde de `pousser()` si un
 * conflit était en cours — c'est précisément le point : l'utilisateur vient
 * de trancher. */
export async function ecraserDistantAvecLocal() {
  const jeton = chargerJeton()
  if (!jeton) throw new Error('aucun jeton enregistré')

  debuterSynchronisation()
  try {
    effacerConflit()
    await pousser(jeton)
    terminerSynchronisation(null, 'Version distante écrasée avec cet appareil.')
  } catch (erreur) {
    terminerSynchronisation(erreur.message, null)
  }
}

/** Symétrique : remplace l'état local par le distant, sans passer par la
 * détection de conflit. */
export async function ecraserLocalAvecDistant() {
  const jeton = chargerJeton()
  if (!jeton) throw new Error('aucun jeton enregistré')

  debuterSynchronisation()
  try {
    effacerConflit()
    const payloadDistant = await lireEtatDistant(jeton)
    if (!payloadDistant) throw new Error('aucun état distant enregistré')
    const distant = await depaqueter(payloadDistant)
    appliquerEtatDistant(distant)
    sauvegarderDerniereSync(distant.dernierModification)
    terminerSynchronisation(null, 'Cet appareil écrasé avec la version distante.')
  } catch (erreur) {
    terminerSynchronisation(erreur.message, null)
  }
}
