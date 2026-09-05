import { verifierJeton } from './auth.js'

const CLE = 'etat'
const CHAMPS_REQUIS = ['dernierModification', 'appareilId', 'iv', 'blob']

/** GET /etat — l'état chiffré partagé entre appareils, protégé par jeton.
 * 404 si personne n'a encore synchronisé : distinct d'un état vide, pour que
 * le front sache qu'il n'y a rien à comparer plutôt que de croire à un état
 * réellement vide. Le worker ne déchiffre jamais rien : `iv`/`blob` lui sont
 * opaques ; `dernierModification`/`appareilId` restent en clair, seule
 * information nécessaire pour comparer la fraîcheur sans déchiffrement
 * (cf. CLAUDE.md § « Le ticker ne suffit pas » pour l'esprit : jamais de
 * décision silencieuse sur une donnée qu'on ne peut pas vérifier). */
export async function gererLireEtat(requete, env) {
  if (!verifierJeton(requete, env)) {
    return { corps: { erreur: 'jeton invalide' }, statut: 401 }
  }
  const valeur = await env.ETAT_KV.get(CLE)
  if (!valeur) return { corps: { erreur: 'aucun état synchronisé' }, statut: 404 }
  return { corps: JSON.parse(valeur), statut: 200 }
}

/** PUT /etat — remplace l'état partagé. Le corps doit être
 * { dernierModification, appareilId, iv, blob } ; seule la forme est
 * validée, jamais le contenu chiffré. */
export async function gererEcrireEtat(requete, env) {
  if (!verifierJeton(requete, env)) {
    return { corps: { erreur: 'jeton invalide' }, statut: 401 }
  }

  let corps
  try {
    corps = await requete.json()
  } catch {
    return { corps: { erreur: 'JSON illisible' }, statut: 400 }
  }

  // Présence, pas véracité : une chaîne vide (iv sans chiffrement le temps
  // des tests), un 0 ou un false sont des valeurs présentes, pas absentes.
  const manquants = CHAMPS_REQUIS.filter((champ) => corps[champ] === undefined || corps[champ] === null)
  if (manquants.length > 0) {
    return { corps: { erreur: `champ manquant : ${manquants.join(', ')}` }, statut: 400 }
  }

  await env.ETAT_KV.put(CLE, JSON.stringify(corps))
  return { corps: { ok: true }, statut: 200 }
}
