import { fetchYahoo } from './yahooSession.js'
import { lireCache, ecrireCache } from './cache.js'

// Une clôture journalière ne change plus une fois le marché fermé : le cache
// peut tenir longtemps, contrairement aux cotations (5 min).
const TTL_HISTORIQUE_S = 6 * 60 * 60

// Allowlist : les clés viennent du front (src/lib/periode.js), les valeurs
// sont fixées ici. Aucune chaîne venue du client ne traverse vers Yahoo, et
// une clé inconnue est refusée avant tout appel réseau.
const PERIODES = {
  '1m': { range: '1mo', interval: '1d' },
  '3m': { range: '3mo', interval: '1d' },
  '1a': { range: '1y', interval: '1d' },
  tout: { range: 'max', interval: '1wk' },
}

/**
 * GET /historique?ticker=…&periode=1m|3m|1a|tout — clôtures journalières d'un
 * instrument, via l'API chart de Yahoo.
 *
 * Réponse : `{ ticker, devise, points: [{ date, cloture }] }`. Les jours sans
 * cotation (fériés, suspensions) reviennent à `null` chez Yahoo et sont
 * écartés : une clôture nulle tracée à zéro ferait plonger la courbe.
 */
export async function gererHistorique(url) {
  const ticker = (url.searchParams.get('ticker') ?? '').trim()
  const periode = (url.searchParams.get('periode') ?? '').trim()

  if (!ticker) return { corps: { erreur: 'paramètre ticker requis' }, statut: 400 }

  const fenetre = Object.hasOwn(PERIODES, periode) ? PERIODES[periode] : null
  if (!fenetre) return { corps: { erreur: 'période inconnue' }, statut: 400 }

  const nomCache = `historique:${ticker}:${periode}`
  const enCache = await lireCache(nomCache)
  if (enCache) return { corps: enCache, statut: 200 }

  // Le ticker part dans le chemin, pas dans la query : sans encodage, les
  // indices (^GSPC, ^FCHI) et les futures (GC=F) partent faux.
  const cible = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`)
  cible.searchParams.set('range', fenetre.range)
  cible.searchParams.set('interval', fenetre.interval)

  const reponse = await fetchYahoo(cible.toString())
  if (!reponse.ok) {
    return { corps: { erreur: `Yahoo : ${reponse.status}` }, statut: 502 }
  }

  const donnees = await reponse.json()
  const resultat = donnees.chart?.result?.[0]
  if (!resultat) {
    return { corps: { erreur: 'instrument introuvable' }, statut: 404 }
  }

  const horodatages = resultat.timestamp ?? []
  const clotures = resultat.indicators?.quote?.[0]?.close ?? []

  const points = []
  for (let i = 0; i < horodatages.length; i += 1) {
    const cloture = clotures[i]
    if (cloture === null || cloture === undefined) continue
    points.push({ date: new Date(horodatages[i] * 1000).toISOString().slice(0, 10), cloture })
  }

  const corps = { ticker, devise: resultat.meta?.currency ?? null, points }
  await ecrireCache(nomCache, corps, TTL_HISTORIQUE_S)
  return { corps, statut: 200 }
}
