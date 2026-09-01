import { fetchYahoo } from './yahooSession.js'
import { lireCache, ecrireCache } from './cache.js'

const TTL_RECHERCHE_S = 5 * 60
const LIMITE_RESULTATS = 10

/** GET /recherche?q=... — recherche Yahoo par nom ou ISIN, pour choisir le
 * bon instrument à la saisie plutôt que de taper un ticker à l'aveugle (cf.
 * CLAUDE.md § « Le ticker ne suffit pas »). L'endpoint de recherche Yahoo ne
 * renvoie pas la devise : un second appel à /v7/finance/quote sur les
 * symboles trouvés la complète. */
export async function gererRecherche(url) {
  const q = (url.searchParams.get('q') ?? '').trim()
  if (!q) return { corps: { erreur: 'paramètre q requis' }, statut: 400 }

  const nomCache = `recherche:${q.toLowerCase()}`
  const enCache = await lireCache(nomCache)
  if (enCache) return { corps: enCache, statut: 200 }

  const cibleRecherche = new URL('https://query1.finance.yahoo.com/v1/finance/search')
  cibleRecherche.searchParams.set('q', q)
  cibleRecherche.searchParams.set('quotesCount', String(LIMITE_RESULTATS))
  cibleRecherche.searchParams.set('newsCount', '0')

  const reponseRecherche = await fetchYahoo(cibleRecherche.toString())
  if (!reponseRecherche.ok) {
    return { corps: { erreur: `Yahoo : ${reponseRecherche.status}` }, statut: 502 }
  }

  const donneesRecherche = await reponseRecherche.json()
  const candidats = (donneesRecherche.quotes ?? []).filter((candidat) => candidat.symbol).slice(0, LIMITE_RESULTATS)

  if (candidats.length === 0) {
    await ecrireCache(nomCache, [], TTL_RECHERCHE_S)
    return { corps: [], statut: 200 }
  }

  const devisesParSymbole = await devisesDes(candidats.map((c) => c.symbol))

  const resultat = candidats.map((c) => ({
    ticker: c.symbol,
    nom: c.longname ?? c.shortname ?? c.symbol,
    place: c.exchDisp ?? c.exchange ?? '',
    devise: devisesParSymbole[c.symbol] ?? null,
  }))

  await ecrireCache(nomCache, resultat, TTL_RECHERCHE_S)
  return { corps: resultat, statut: 200 }
}

async function devisesDes(symboles) {
  const cible = new URL('https://query1.finance.yahoo.com/v7/finance/quote')
  cible.searchParams.set('symbols', symboles.join(','))

  const reponse = await fetchYahoo(cible.toString())
  if (!reponse.ok) return {}

  const donnees = await reponse.json()
  const devises = {}
  for (const ligne of donnees.quoteResponse?.result ?? []) {
    devises[ligne.symbol] = ligne.currency
  }
  return devises
}
