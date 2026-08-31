import { lireCache, ecrireCache } from './cache.js'

const TTL_BTC_S = 5 * 60
const NOM_CACHE = 'btc'

/** GET /btc — cours du BTC via CoinGecko, en EUR directement : c'est un
 * indicateur de marché affiché tel quel, jamais compté dans le patrimoine
 * (cf. CLAUDE.md § 4). */
export async function gererBtc() {
  const enCache = await lireCache(NOM_CACHE)
  if (enCache) return { corps: enCache, statut: 200 }

  // Sans en-tête proche d'un navigateur, CoinGecko répond 403 aux requêtes
  // sorties des Workers Cloudflare — vérifié en comparant avec un appel direct.
  const reponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur', {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
  })
  if (!reponse.ok) {
    return { corps: { erreur: `CoinGecko : ${reponse.status}` }, statut: 502 }
  }

  const donnees = await reponse.json()
  const prix = donnees.bitcoin?.eur
  if (prix == null) {
    return { corps: { erreur: 'CoinGecko : réponse inattendue' }, statut: 502 }
  }

  const resultat = { prix, devise: 'EUR', horodatage: new Date().toISOString() }
  await ecrireCache(NOM_CACHE, resultat, TTL_BTC_S)
  return { corps: resultat, statut: 200 }
}
