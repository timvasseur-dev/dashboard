// Chiffrement natif (Web Crypto), pour que le worker ne stocke jamais qu'un
// bloc illisible (cf. CLAUDE.md § 7). Aucune dépendance : tout vient de
// `crypto.subtle`, disponible nativement dans le navigateur comme dans les
// Workers.

// Sel fixe, non secret : son seul rôle est d'être stable et identique sur
// tous les appareils, pas de rester caché. Un sel différent par appareil
// casserait la synchro (deux appareils dériveraient des clés différentes de
// la même phrase et ne pourraient jamais se relire).
const SEL = new TextEncoder().encode('vv-investment-sel-fixe-v1')
const ITERATIONS_PBKDF2 = 200_000

// Étaler un grand tableau d'octets dans un appel de fonction
// (`String.fromCharCode(...octets)`) casse au-delà de quelques dizaines de
// milliers d'éléments — chaque élément étalé devient un argument, et le
// moteur JS a une limite d'arguments par appel. Un état de quelques
// centaines de transactions chiffré dépasse largement ce seuil. On construit
// donc la chaîne par blocs.
const TAILLE_BLOC_BASE64 = 8192

function versBase64(tampon) {
  const octets = new Uint8Array(tampon)
  let binaire = ''
  for (let i = 0; i < octets.length; i += TAILLE_BLOC_BASE64) {
    binaire += String.fromCharCode(...octets.subarray(i, i + TAILLE_BLOC_BASE64))
  }
  return btoa(binaire)
}
function depuisBase64(texte) {
  return Uint8Array.from(atob(texte), (c) => c.charCodeAt(0))
}

/** Dérive une clé AES-GCM 256 bits depuis une phrase secrète. Extractable :
 * nécessaire pour la persister en JWK (cf. src/data/cleChiffrement.js). */
export async function deriverCle(phrase) {
  const materiau = await crypto.subtle.importKey('raw', new TextEncoder().encode(phrase), 'PBKDF2', false, [
    'deriveKey',
  ])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: SEL, iterations: ITERATIONS_PBKDF2, hash: 'SHA-256' },
    materiau,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  )
}

/** Chiffre un objet JSON-sérialisable. IV aléatoire à chaque appel — jamais
 * réutilisé, condition de sécurité d'AES-GCM. */
export async function chiffrer(cle, objetClair) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const donnees = new TextEncoder().encode(JSON.stringify(objetClair))
  const chiffre = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cle, donnees)
  return { iv: versBase64(iv), blob: versBase64(chiffre) }
}

/** Déchiffre : lève si la clé (donc la phrase) ne correspond pas au blob. */
export async function dechiffrer(cle, { iv, blob }) {
  const dechiffre = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: depuisBase64(iv) }, cle, depuisBase64(blob))
  return JSON.parse(new TextDecoder().decode(dechiffre))
}

/** Pour persister la clé dérivée (jamais la phrase) — cf. cleChiffrement.js. */
export async function exporterCle(cle) {
  return crypto.subtle.exportKey('jwk', cle)
}
export async function importerCle(jwk) {
  return crypto.subtle.importKey('jwk', jwk, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt'])
}
