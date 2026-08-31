// Cours boursiers = information publique : la protection appropriée est une
// restriction d'origine, pas un jeton (celui-ci arrive en phase 4, quand le
// worker touchera des données personnelles). Cf. CLAUDE.md § « Sécurité ».
const ORIGINES_AUTORISEES = new Set([
  'https://timvasseur-dev.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
])

/** En-têtes CORS pour une origine donnée, ou {} si elle n'est pas autorisée. */
export function enTetesCors(origine) {
  if (!ORIGINES_AUTORISEES.has(origine)) return {}
  return {
    'Access-Control-Allow-Origin': origine,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    Vary: 'Origin',
  }
}

export function reponsePreflight(origine) {
  return new Response(null, { status: 204, headers: enTetesCors(origine) })
}
