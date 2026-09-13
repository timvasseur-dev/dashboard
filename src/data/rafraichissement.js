// Orchestration du rafraîchissement des cours : rassemble les tickers
// utiles, n'interroge le worker que pour ce qui est manquant ou périmé (sauf
// geste explicite), écrit les résultats via le store. Un échec réseau ne
// touche jamais le cache existant : au pire on garde les dernières valeurs
// connues et on le signale via statutRafraichissement.
import { etatCourant, majCours, majTauxUsd } from './store.js'
import { recupererCours, recupererBtc, recupererTauxUsd } from './coursApi.js'
import { debuterRafraichissement, terminerRafraichissement } from './statutRafraichissement.js'
import { ageMs } from '../lib/date.js'

// Le BTC est un indicateur de marché (cf. CLAUDE.md § 4), pas un ticker
// suivi par une position ou une idée : préfixé pour ne jamais entrer en
// collision avec un vrai ticker Yahoo.
export const TICKER_BTC = 'CRYPTO:BTC'

// Même précaution pour les indices et l'or : ils sont rangés dans `quotes`
// sous un préfixe, donc structurellement hors d'atteinte de `consolider()`,
// qui ne lit `quotes` que par le ticker d'une position réelle. Un indicateur
// ne peut pas entrer dans un total, même par erreur de saisie.
const PREFIXE_MARCHE = 'MARCHE:'

export const cleMarche = (ticker) => `${PREFIXE_MARCHE}${ticker}`

/** Les indicateurs suivis sur l'écran Marché. `nature` dit comment les lire :
 * un indice se compte en points — « 7 500 € » pour le CAC 40 n'aurait aucun
 * sens — l'or se cote en dollars l'once. */
export const INDICATEURS = [
  { ticker: '^GSPC', libelle: 'S&P 500', detail: 'Indice, en points', nature: 'indice' },
  { ticker: '^IXIC', libelle: 'Nasdaq Composite', detail: 'Indice, en points', nature: 'indice' },
  { ticker: '^FCHI', libelle: 'CAC 40', detail: 'Indice, en points', nature: 'indice' },
  { ticker: 'GC=F', libelle: 'Or', detail: 'Future COMEX, l’once', nature: 'devise' },
]

// Alignés sur le TTL du cache worker : en dessous, rappeler le réseau ne
// renvoie de toute façon que la même valeur déjà en cache côté worker.
const SEUIL_COTATIONS_MS = 5 * 60 * 1000
const SEUIL_FX_MS = 60 * 60 * 1000

function tickersSuivis(etat) {
  const tickers = new Set()
  for (const position of etat.positions) tickers.add(position.ticker)
  for (const suivi of etat.watchlist) tickers.add(suivi.ticker)
  return [...tickers]
}

async function rafraichirCotations(force) {
  const etat = etatCourant()
  const tickers = tickersSuivis(etat)
  const aRafraichir = force
    ? tickers
    : tickers.filter((ticker) => ageMs(etat.quotes[ticker]?.horodatage) > SEUIL_COTATIONS_MS)

  if (aRafraichir.length === 0) return

  const resultat = await recupererCours(aRafraichir)
  for (const [ticker, cours] of Object.entries(resultat)) {
    majCours(ticker, cours)
  }

  // Un ticker demandé mais absent de la réponse ne doit jamais se confondre
  // avec « pas encore demandé » : les tickers déjà présents ont bien été
  // écrits ci-dessus (succès partiel conservé), mais l'écart est signalé
  // plutôt que masqué en silence.
  const introuvables = aRafraichir.filter((ticker) => !Object.hasOwn(resultat, ticker))
  if (introuvables.length > 0) {
    throw new Error(`absent de la réponse Yahoo : ${introuvables.join(', ')}`)
  }
}

async function rafraichirMarche(force) {
  const etat = etatCourant()
  const appels = []

  if (force || ageMs(etat.quotes[TICKER_BTC]?.horodatage) > SEUIL_COTATIONS_MS) {
    appels.push(recupererBtc().then((btc) => majCours(TICKER_BTC, btc)))
  }

  const indicateurs = INDICATEURS.filter(
    (indicateur) => force || ageMs(etat.quotes[cleMarche(indicateur.ticker)]?.horodatage) > SEUIL_COTATIONS_MS,
  )
  if (indicateurs.length > 0) {
    appels.push(
      recupererCours(indicateurs.map((indicateur) => indicateur.ticker)).then((resultat) => {
        for (const [ticker, cours] of Object.entries(resultat)) {
          majCours(cleMarche(ticker), cours)
        }
      }),
    )
  }
  if (force || ageMs(etat.fx['USD/EUR']?.horodatage) > SEUIL_FX_MS) {
    appels.push(recupererTauxUsd().then((fx) => majTauxUsd(fx.taux)))
  }

  await Promise.all(appels)
}

/** Résout à `true` si le rafraîchissement a abouti, `false` sinon — jamais un
 * rejet : un échec réseau est un cas normal ici, pas une exception. L'appelant
 * qui en dépend (l'instantané automatique) a besoin de savoir si les cours
 * qu'il s'apprête à figer viennent d'être confirmés ou datent d'avant. */
async function executer(promesse) {
  debuterRafraichissement()
  try {
    await promesse
    terminerRafraichissement(null)
    return true
  } catch (erreur) {
    terminerRafraichissement(erreur.message ?? 'échec du rafraîchissement')
    return false
  }
}

/** Au montage de l'app : respecte les seuils de fraîcheur, pas de sondage —
 * mobile en 4G, l'app s'ouvre plusieurs fois par jour. */
export function rafraichirAuDemarrage() {
  return executer(Promise.all([rafraichirCotations(false), rafraichirMarche(false)]))
}

/** Geste explicite sur l'écran Bourse : ignore la fraîcheur, tickers des
 * positions et de la watchlist. */
export function actualiserBourse() {
  return executer(rafraichirCotations(true))
}

/** Geste explicite sur l'écran Marché : ignore la fraîcheur, BTC + taux. */
export function actualiserMarche() {
  return executer(rafraichirMarche(true))
}
