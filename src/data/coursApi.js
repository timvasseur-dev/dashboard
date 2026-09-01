// Appels réseau vers le worker de proxy de cotations (worker/, déployé à
// part). Seul fichier de src/data/ à parler au réseau pour les cours — cf.
// CLAUDE.md § « Contraintes » : les appels réseau vivent dans src/data/,
// jamais dans un composant.
const BASE_URL = 'https://vv-cours.timvasseurini.workers.dev'

async function recuperer(chemin) {
  const reponse = await fetch(`${BASE_URL}${chemin}`)
  if (!reponse.ok) throw new Error(`worker cotations : ${reponse.status}`)
  return reponse.json()
}

/** { [ticker]: { prix, devise, horodatage } } — un ticker introuvable chez
 * Yahoo est simplement absent du résultat, pas une erreur. */
export function recupererCours(tickers) {
  if (tickers.length === 0) return Promise.resolve({})
  return recuperer(`/cours?tickers=${tickers.map(encodeURIComponent).join(',')}`)
}

export function recupererBtc() {
  return recuperer('/btc')
}

export function recupererTauxUsd() {
  return recuperer('/taux/usd-eur')
}

/** [{ ticker, nom, place, devise }] — recherche par nom ou ISIN. Le ticker
 * seul n'identifie pas un instrument (cf. CLAUDE.md § « Le ticker ne suffit
 * pas ») : cette route sert à choisir plutôt qu'à deviner. */
export function rechercherInstrument(q) {
  return recuperer(`/recherche?q=${encodeURIComponent(q)}`)
}
