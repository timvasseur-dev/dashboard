// Proxy de cotations. Une seule responsabilité, quatre routes : cours
// d'actions/ETF (Yahoo), recherche d'instrument (Yahoo), cours du BTC
// (CoinGecko), taux USD/EUR (Frankfurter). Rien d'autre ici — pas de
// notification, pas de tâche planifiée : ces routes-là vivront dans un
// fichier séparé si elles arrivent.
import { enTetesCors, reponsePreflight } from './cors.js'
import { gererCours } from './cours.js'
import { gererRecherche } from './recherche.js'
import { gererBtc } from './btc.js'
import { gererFx } from './fx.js'

export default {
  async fetch(requete) {
    const url = new URL(requete.url)
    const origine = requete.headers.get('Origin') ?? ''

    if (requete.method === 'OPTIONS') return reponsePreflight(origine)

    let resultat
    try {
      resultat = await router(url)
    } catch (erreur) {
      resultat = { corps: { erreur: erreur.message ?? 'erreur interne' }, statut: 500 }
    }

    return new Response(JSON.stringify(resultat.corps), {
      status: resultat.statut,
      headers: { 'Content-Type': 'application/json', ...enTetesCors(origine) },
    })
  },
}

async function router(url) {
  switch (url.pathname) {
    case '/cours':
      return gererCours(url)
    case '/recherche':
      return gererRecherche(url)
    case '/btc':
      return gererBtc()
    case '/taux/usd-eur':
      return gererFx()
    default:
      return { corps: { erreur: 'route inconnue' }, statut: 404 }
  }
}
