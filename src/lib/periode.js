/*
 * Périodes d'affichage des courbes. Les clés sont aussi celles que le worker
 * accepte sur /historique (cf. worker/src/historiqueCours.js) : une seule
 * liste de part et d'autre, pour qu'aucune valeur ne puisse diverger.
 */
export const PERIODES = [
  { cle: '1m', libelle: '1 mois', mois: 1 },
  { cle: '3m', libelle: '3 mois', mois: 3 },
  { cle: '1a', libelle: '1 an', mois: 12 },
  { cle: 'tout', libelle: 'Tout', mois: null },
]

/**
 * Recule d'un nombre de mois en bornant explicitement le jour du mois.
 *
 * `setMonth` déborde sans prévenir quand le jour n'existe pas dans le mois
 * cible : au 31 mars, reculer d'un mois donne le 3 mars (février n'ayant que
 * 28 jours, JS repart sur le mois suivant). `setDate(0)` ramène alors au
 * dernier jour du mois visé — 28 ou 29 février selon l'année.
 */
function reculerDeMois(date, mois) {
  const jour = date.getDate()
  const resultat = new Date(date)
  resultat.setMonth(resultat.getMonth() - mois)
  if (resultat.getDate() !== jour) resultat.setDate(0)
  return resultat
}

/**
 * Début de la période demandée, à minuit heure locale, ou `null` pour « tout »
 * (et pour une clé inconnue, traitée comme « pas de borne » plutôt que comme
 * une erreur : une période absente ne doit pas vider un écran).
 */
export function debutPeriode(cle, maintenant = new Date()) {
  const periode = PERIODES.find((p) => p.cle === cle)
  if (!periode || periode.mois === null) return null

  const debut = reculerDeMois(maintenant, periode.mois)
  debut.setHours(0, 0, 0, 0)
  return debut
}
