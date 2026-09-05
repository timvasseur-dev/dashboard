// Cycle de vie de la clé de chiffrement, séparé de crypto.js (les
// primitives) et de syncLocal.js (le stockage brut) : ce fichier est le seul
// qui décide quand dériver, mettre en cache, ou oublier.
import { deriverCle, exporterCle, importerCle } from '../lib/crypto.js'
import { chargerCleChiffrement, sauvegarderCleChiffrement, oublierCleChiffrement } from './syncLocal.js'

let cleMemoire = null // CryptoKey réhydraté depuis le JWK persisté, mis en cache pour la session

/** Clé courante, ou null si la phrase n'a jamais été saisie sur cet appareil
 * (ou a été oubliée) — à charge de l'appelant de la redemander. */
export async function obtenirCle() {
  if (cleMemoire) return cleMemoire
  const jwk = chargerCleChiffrement()
  if (!jwk) return null
  cleMemoire = await importerCle(jwk)
  return cleMemoire
}

/** Dérive et persiste la clé depuis une phrase saisie par l'utilisateur. La
 * phrase elle-même n'est jamais conservée, seule la clé dérivée l'est —
 * choix du propriétaire des données : l'écran de verrouillage du téléphone
 * est la protection réelle (cf. CLAUDE.md § 7). Si la phrase est perdue, la
 * clé l'est aussi : irrécupérable, l'export JSON en clair reste le filet de
 * sécurité. */
export async function definirPhrase(phrase) {
  cleMemoire = await deriverCle(phrase)
  sauvegarderCleChiffrement(await exporterCle(cleMemoire))
}

/** Bouton « Oublier la phrase sur cet appareil » dans Réglages : redemande
 * la phrase au prochain chiffrement/déchiffrement. */
export function oublierPhrase() {
  cleMemoire = null
  oublierCleChiffrement()
}
