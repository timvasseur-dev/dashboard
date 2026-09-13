import { fetchYahoo } from './yahooSession.js'
import { lireCache, ecrireCache } from './cache.js'

/*
 * Allowlist des périodes. Les clés viennent du front (src/lib/periode.js), les
 * valeurs sont fixées ici : aucune chaîne venue du client ne traverse vers
 * Yahoo, et une clé inconnue est refusée avant tout appel réseau.
 *
 * `range` ou `jours` — jamais les deux. `jours` demande une fenêtre glissante
 * (period1/period2) parce que Yahoo n'a pas de `range` de trois jours : son
 * `5d` vaut cinq séances, soit près d'une semaine calendaire.
 *
 * `ttl` suit le pas des bougies : mettre en cache plus longtemps qu'un
 * intervalle reviendrait à cacher la bougie suivante. Six heures pour les
 * clôtures journalières, qui ne bougent plus une fois le marché fermé.
 *
 * Profondeurs maximales côté Yahoo, vérifiées à l'appel et annoncées par ses
 * propres messages d'erreur : 1m → 8 jours, intervalles infra-horaires → 60
 * derniers jours, 1h → 730 derniers jours. Les combinaisons ci-dessous restent
 * largement en deçà.
 */
const MINUTE_S = 60
const HEURE_S = 60 * 60

const PERIODES = {
  '1j': { range: '1d', interval: '5m', intraday: true, ttl: 5 * MINUTE_S },
  '3j': { jours: 3, interval: '15m', intraday: true, ttl: 15 * MINUTE_S },
  '1sem': { range: '5d', interval: '1h', intraday: true, ttl: HEURE_S },
  '1m': { range: '1mo', interval: '1d', intraday: false, ttl: 6 * HEURE_S },
  '3m': { range: '3mo', interval: '1d', intraday: false, ttl: 6 * HEURE_S },
  '1a': { range: '1y', interval: '1d', intraday: false, ttl: 6 * HEURE_S },
  tout: { range: 'max', interval: '1wk', intraday: false, ttl: 6 * HEURE_S },
}

/**
 * GET /historique?ticker=…&periode=1j|3j|1sem|1m|3m|1a|tout — cours d'un
 * instrument sur la période, en bougies journalières ou intraday selon elle.
 *
 * Réponse : `{ ticker, devise, points: [{ date, cloture }] }`. Les moments sans
 * cotation reviennent à `null` chez Yahoo et sont écartés : une clôture nulle
 * tracée à zéro ferait plonger la courbe. En intraday ce n'est pas un cas
 * rare — l'or en compte 84 sur 288 sur une journée en pas de cinq minutes.
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

  const reponse = await fetchYahoo(cibleYahoo(ticker, fenetre))
  if (!reponse.ok) {
    return { corps: { erreur: `Yahoo : ${reponse.status}` }, statut: 502 }
  }

  const donnees = await reponse.json()
  const resultat = donnees.chart?.result?.[0]
  if (!resultat) {
    return { corps: { erreur: 'instrument introuvable' }, statut: 404 }
  }

  const corps = {
    ticker,
    devise: resultat.meta?.currency ?? null,
    points: pointsDe(resultat, fenetre.intraday),
  }

  await ecrireCache(nomCache, corps, fenetre.ttl)
  return { corps, statut: 200 }
}

/** URL de l'API chart. Le ticker part dans le chemin, pas dans la query : sans
 * encodage, les indices (^GSPC, ^FCHI) et les futures (GC=F) partiraient
 * faux. */
function cibleYahoo(ticker, fenetre) {
  const cible = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`)
  cible.searchParams.set('interval', fenetre.interval)

  if (fenetre.jours) {
    const fin = Math.floor(Date.now() / 1000)
    cible.searchParams.set('period1', String(fin - fenetre.jours * 24 * 60 * 60))
    cible.searchParams.set('period2', String(fin))
  } else {
    cible.searchParams.set('range', fenetre.range)
  }

  return cible.toString()
}

/** Points exploitables, horodatage compris. `intraday` distingue les deux
 * granularités : une bougie de cinq minutes a besoin de l'heure, une clôture
 * journalière n'a besoin que du jour. */
function pointsDe(resultat, intraday) {
  const horodatages = resultat.timestamp ?? []
  const clotures = resultat.indicators?.quote?.[0]?.close ?? []

  const points = []
  for (let i = 0; i < horodatages.length; i += 1) {
    const cloture = clotures[i]
    if (cloture === null || cloture === undefined) continue
    const iso = new Date(horodatages[i] * 1000).toISOString()
    points.push({ date: intraday ? iso : iso.slice(0, 10), cloture })
  }
  return points
}
