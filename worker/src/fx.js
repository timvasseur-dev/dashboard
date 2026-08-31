import { lireCache, ecrireCache } from './cache.js'

const TTL_FX_S = 60 * 60
const NOM_CACHE = 'fx-usd-eur'

/** GET /taux/usd-eur — taux de référence BCE via Frankfurter, une heure de
 * cache : suffisant pour la valorisation d'un CTO affichée à l'utilisateur. */
export async function gererFx() {
  const enCache = await lireCache(NOM_CACHE)
  if (enCache) return { corps: enCache, statut: 200 }

  const reponse = await fetch('https://api.frankfurter.dev/v1/latest?from=USD&to=EUR')
  if (!reponse.ok) {
    return { corps: { erreur: `Frankfurter : ${reponse.status}` }, statut: 502 }
  }

  const donnees = await reponse.json()
  const taux = donnees.rates?.EUR
  if (taux == null) {
    return { corps: { erreur: 'Frankfurter : réponse inattendue' }, statut: 502 }
  }

  const resultat = { taux, horodatage: new Date().toISOString() }
  await ecrireCache(NOM_CACHE, resultat, TTL_FX_S)
  return { corps: resultat, statut: 200 }
}
