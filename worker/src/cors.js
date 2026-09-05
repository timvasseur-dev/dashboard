// Cours boursiers = information publique : la protection appropriée est une
// restriction d'origine, pas un jeton. Les routes /etat (phase 4, données
// personnelles) vérifient en plus un jeton (cf. worker/src/auth.js) — le CORS
// ici n'est qu'une capacité annoncée au navigateur, pas un contrôle d'accès.
const ORIGINES_AUTORISEES = new Set([
  'https://timvasseur-dev.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
])

/** En-têtes CORS pour une origine donnée, ou {} si elle n'est pas autorisée. */
export function enTetesCors(origine, methodes = 'GET, OPTIONS') {
  if (!ORIGINES_AUTORISEES.has(origine)) return {}
  return {
    'Access-Control-Allow-Origin': origine,
    'Access-Control-Allow-Methods': methodes,
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    Vary: 'Origin',
  }
}

// Annonce toujours la réunion des méthodes/en-têtes de toutes les routes :
// le OPTIONS ne fait qu'annoncer une capacité CORS, l'accès réel reste
// vérifié route par route (jeton sur /etat, rien sur les cotations).
export function reponsePreflight(origine) {
  return new Response(null, { status: 204, headers: enTetesCors(origine, 'GET, PUT, OPTIONS') })
}
