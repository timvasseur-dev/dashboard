// Vérifie le jeton de synchro sur les routes qui touchent des données
// personnelles (cf. CLAUDE.md § « Sécurité »). Les routes de cotations
// restent publiques, sans jeton : elles ne servent que de l'information
// publique (cf. worker/src/cors.js).

/** Compare deux chaînes en temps constant : un retour anticipé au premier
 * octet différent laisserait deviner le jeton par mesure de latence,
 * octet par octet. */
function egalesTempsConstant(a, b) {
  const longueur = Math.max(a.length, b.length)
  let diff = a.length ^ b.length
  for (let i = 0; i < longueur; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
  }
  return diff === 0
}

/** true si la requête porte `Authorization: Bearer <jeton>` et que ce jeton
 * correspond au secret `JETON_SYNC` posé par `wrangler secret put`. */
export function verifierJeton(requete, env) {
  const entete = requete.headers.get('Authorization') ?? ''
  const [type, jeton] = entete.split(' ')
  if (type !== 'Bearer' || !jeton) return false
  return egalesTempsConstant(jeton, env.JETON_SYNC ?? '')
}
