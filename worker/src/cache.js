// Petit wrapper autour de la Cache API des Workers : pas de KV en phase 3
// (réservé à la phase 4), un TTL exprimé via Cache-Control suffit à protéger
// des limites de débit et à accélérer l'affichage.
const cache = caches.default

function cleInterne(nom) {
  return new Request(`https://cache.interne.invalid/${nom}`)
}

export async function lireCache(nom) {
  const reponse = await cache.match(cleInterne(nom))
  if (!reponse) return null
  return reponse.json()
}

export async function ecrireCache(nom, valeur, ttlSecondes) {
  const reponse = new Response(JSON.stringify(valeur), {
    headers: { 'Cache-Control': `max-age=${ttlSecondes}` },
  })
  await cache.put(cleInterne(nom), reponse)
}
