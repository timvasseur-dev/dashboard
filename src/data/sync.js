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
import {
  debuterSynchronisation,
  terminerSynchronisation,
  definirConflit,
  effacerConflit,
  statutSynchronisationCourant,
} from './statutSynchronisation.js'

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

    switch (decision) {
      case 'a-jour':
        terminerSynchronisation(null, null)
        break

      case 'a-pousser':
        terminerSynchronisation(null, 'Modifications locales non encore synchronisées.')
        break

      case 'a-tirer': {
        const distant = await depaqueter(payloadDistant)
        appliquerEtatDistant(distant)
        sauvegarderDerniereSync(distant.dernierModification)
        terminerSynchronisation(null, 'Mis à jour depuis un autre appareil.')
        break
      }

      case 'conflit':
        definirConflit({ local, distant: await depaqueter(payloadDistant) })
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

    if (decision === 'conflit') {
      definirConflit({ local, distant: await depaqueter(payloadDistant) })
      terminerSynchronisation(null, null)
      return
    }
    if (decision === 'a-tirer') {
      const distant = await depaqueter(payloadDistant)
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
