// Appels réseau vers la route /etat du worker de proxy (cf. coursApi.js pour
// le même patron sur les cotations). Seule différence : ces routes exigent
// un jeton.
const BASE_URL = 'https://vv-cours.timvasseurini.workers.dev'

function appelAuthentifie(chemin, jeton, options = {}) {
  return fetch(`${BASE_URL}${chemin}`, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${jeton}` },
  })
}

/** État distant (forme { dernierModification, appareilId, iv, blob }), ou
 * null si personne n'a encore synchronisé (404) — distinct d'une erreur. */
export async function lireEtatDistant(jeton) {
  const reponse = await appelAuthentifie('/etat', jeton)
  if (reponse.status === 404) return null
  if (!reponse.ok) throw new Error(`sync : ${reponse.status}`)
  return reponse.json()
}

export async function ecrireEtatDistant(jeton, payload) {
  const reponse = await appelAuthentifie('/etat', jeton, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!reponse.ok) throw new Error(`sync : ${reponse.status}`)
}

/** Traduit la réponse en exactement 3 issues pour l'écran Réglages : jeton
 * valide, jeton refusé, worker injoignable. Jamais un 4e cas silencieux. */
export async function testerConnexion(jeton) {
  try {
    const reponse = await appelAuthentifie('/etat', jeton)
    if (reponse.status === 401) return 'refuse'
    if (reponse.ok || reponse.status === 404) return 'valide'
    return 'injoignable'
  } catch {
    return 'injoignable'
  }
}
