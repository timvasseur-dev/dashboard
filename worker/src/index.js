// Proxy de cotations + stockage synchronisé (phase 4). Une responsabilité
// par fichier : cours d'actions/ETF (Yahoo), recherche d'instrument (Yahoo),
// cours du BTC (CoinGecko), taux USD/EUR (Frankfurter) — publics, sans
// jeton ; état partagé (KV) — privé, protégé par jeton (cf. auth.js).
import { enTetesCors, reponsePreflight } from './cors.js'
import { gererCours } from './cours.js'
import { gererRecherche } from './recherche.js'
import { gererBtc } from './btc.js'
import { gererFx } from './fx.js'
import { gererLireEtat, gererEcrireEtat } from './etat.js'

export default {
  async fetch(requete, env) {
    const url = new URL(requete.url)
    const origine = requete.headers.get('Origin') ?? ''

    if (requete.method === 'OPTIONS') return reponsePreflight(origine)

    let resultat
    try {
      resultat = await router(url, requete, env)
    } catch (erreur) {
      resultat = { corps: { erreur: erreur.message ?? 'erreur interne' }, statut: 500 }
    }

    return new Response(JSON.stringify(resultat.corps), {
      status: resultat.statut,
      headers: { 'Content-Type': 'application/json', ...enTetesCors(origine, 'GET, PUT, OPTIONS') },
    })
  },
}

async function router(url, requete, env) {
  switch (url.pathname) {
    case '/cours':
      return gererCours(url)
    case '/recherche':
      return gererRecherche(url)
    case '/btc':
      return gererBtc()
    case '/taux/usd-eur':
      return gererFx()
    case '/etat':
      if (requete.method === 'GET') return gererLireEtat(requete, env)
      if (requete.method === 'PUT') return gererEcrireEtat(requete, env)
      return { corps: { erreur: 'méthode non autorisée' }, statut: 405 }
    default:
      return { corps: { erreur: 'route inconnue' }, statut: 404 }
  }
}
