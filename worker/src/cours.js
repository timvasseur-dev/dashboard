import { fetchYahoo } from './yahooSession.js'
import { lireCache, ecrireCache } from './cache.js'

const TTL_COURS_S = 5 * 60

/** GET /cours?tickers=A,B — cotations Yahoo Finance, quelques minutes de cache.
 * Un ticker introuvable chez Yahoo est simplement absent du résultat : au
 * front de traiter l'absence comme "sans cours", pas comme une erreur. */
export async function gererCours(url) {
  const tickers = (url.searchParams.get('tickers') ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  if (tickers.length === 0) {
    return { corps: { erreur: 'paramètre tickers requis' }, statut: 400 }
  }

  const nomCache = `cours:${[...tickers].sort().join(',')}`
  const enCache = await lireCache(nomCache)
  if (enCache) return { corps: enCache, statut: 200 }

  const cible = new URL('https://query1.finance.yahoo.com/v7/finance/quote')
  cible.searchParams.set('symbols', tickers.join(','))

  const reponse = await fetchYahoo(cible.toString())
  if (!reponse.ok) {
    return { corps: { erreur: `Yahoo : ${reponse.status}` }, statut: 502 }
  }

  const donnees = await reponse.json()
  const horodatage = new Date().toISOString()
  const resultat = {}
  for (const ligne of donnees.quoteResponse?.result ?? []) {
    resultat[ligne.symbol] = {
      prix: ligne.regularMarketPrice,
      devise: ligne.currency,
      horodatage,
    }
  }

  await ecrireCache(nomCache, resultat, TTL_COURS_S)
  return { corps: resultat, statut: 200 }
}
