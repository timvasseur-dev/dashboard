// Session Yahoo Finance : l'API exige un cookie + un crumb depuis mi-2023.
// Sans eux, les requêtes de cotation renvoient 401/403. C'est le point qui
// fait tenir un proxy de cotations dans la durée, plutôt que de tomber au
// bout de quelques semaines quand une session negociée à la main expire.
import { lireCache, ecrireCache } from './cache.js'

const NOM_CACHE = 'yahoo-session'
const TTL_SESSION_S = 60 * 30 // 30 min : largement la durée de vie réelle du couple

// Sans en-tête proche d'un navigateur, Yahoo répond 429/401 au lieu de
// délivrer un cookie ou un crumb valide — vérifié en jouant la séquence à la
// main. Constante partagée : cookie et crumb doivent provenir du même UA.
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

let sessionMemoire = null // survit tant que l'isolate reste chaud

async function obtenirCookie() {
  const reponse = await fetch('https://fc.yahoo.com', {
    redirect: 'manual',
    headers: { 'User-Agent': USER_AGENT },
  })
  const entete = reponse.headers.get('set-cookie')
  if (!entete) throw new Error('Yahoo : pas de cookie de session')
  return entete.split(';')[0]
}

async function obtenirCrumb(cookie) {
  const reponse = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
    headers: { Cookie: cookie, 'User-Agent': USER_AGENT },
  })
  if (!reponse.ok) throw new Error(`Yahoo : crumb refusé (${reponse.status})`)
  const crumb = await reponse.text()
  if (!crumb || crumb.includes('<html')) throw new Error('Yahoo : crumb invalide')
  return crumb
}

async function nouvelleSession() {
  const cookie = await obtenirCookie()
  const crumb = await obtenirCrumb(cookie)
  const session = { cookie, crumb }
  sessionMemoire = session
  await ecrireCache(NOM_CACHE, session, TTL_SESSION_S)
  return session
}

/** Session courante : mémoire d'isolate, puis cache d'edge, puis renégociation. */
async function sessionYahoo() {
  if (sessionMemoire) return sessionMemoire
  const enCache = await lireCache(NOM_CACHE)
  if (enCache) {
    sessionMemoire = enCache
    return enCache
  }
  return nouvelleSession()
}

function requeteAvecCrumb(url, session) {
  const cible = new URL(url)
  cible.searchParams.set('crumb', session.crumb)
  return fetch(cible, { headers: { Cookie: session.cookie, 'User-Agent': USER_AGENT } })
}

/** GET authentifié auprès de Yahoo, avec un rattrapage de session unique
 * sur 401/403 : la session en cache peut avoir expiré côté Yahoo sans
 * prévenir. Au-delà d'un seul rattrapage, l'échec est renvoyé tel quel. */
export async function fetchYahoo(url) {
  const session = await sessionYahoo()
  const reponse = await requeteAvecCrumb(url, session)
  if (reponse.status !== 401 && reponse.status !== 403) return reponse

  sessionMemoire = null
  const nouvelle = await nouvelleSession()
  return requeteAvecCrumb(url, nouvelle)
}
