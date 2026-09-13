/*
 * Périodes d'affichage des courbes. Les clés sont aussi celles que le worker
 * accepte sur /historique (cf. worker/src/historiqueCours.js) : une seule
 * liste de part et d'autre, pour qu'aucune valeur ne puisse diverger.
 *
 * `fraicheurMs` borne le cache en mémoire du front (cf. data/historiqueCours.js).
 * Il double le TTL du worker plutôt qu'il ne le remplace : sans lui, une
 * courbe intraday chargée une fois resterait figée tant que l'onglet vit,
 * quelle que soit la durée de cache côté worker.
 */
const MINUTE_MS = 60 * 1000
const HEURE_MS = 60 * MINUTE_MS

export const PERIODES = [
  { cle: '1j', libelle: '1 j', jours: 1, intraday: true, fraicheurMs: 5 * MINUTE_MS },
  { cle: '3j', libelle: '3 j', jours: 3, intraday: true, fraicheurMs: 15 * MINUTE_MS },
  { cle: '1sem', libelle: '1 sem', jours: 7, intraday: true, fraicheurMs: HEURE_MS },
  { cle: '1m', libelle: '1 mois', mois: 1, intraday: false, fraicheurMs: 6 * HEURE_MS },
  { cle: '3m', libelle: '3 mois', mois: 3, intraday: false, fraicheurMs: 6 * HEURE_MS },
  { cle: '1a', libelle: '1 an', mois: 12, intraday: false, fraicheurMs: 6 * HEURE_MS },
  { cle: 'tout', libelle: 'Tout', mois: null, intraday: false, fraicheurMs: 6 * HEURE_MS },
]

/**
 * Les périodes offertes sur la courbe du patrimoine : les longues seulement.
 *
 * L'historique du patrimoine est fait d'instantanés, un par jour au plus (cf.
 * data/instantaneAuto.js). Une période d'un jour y contiendrait un point, trois
 * jours en contiendraient trois — et moins encore les semaines à jours fériés.
 * Il n'y a pas de courbe à en tirer, seulement un graphique vide à expliquer.
 */
export const PERIODES_PATRIMOINE = PERIODES.filter((periode) => !periode.intraday)

/** Les périodes offertes sur la fiche d'un titre : toutes. Un cours a autant
 * de points qu'il y a de bougies, donc une journée en a des dizaines. */
export const PERIODES_TITRE = PERIODES

export function periodeParCle(cle) {
  return PERIODES.find((periode) => periode.cle === cle) ?? null
}

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
 * Début de la période demandée, ou `null` pour « tout » — et pour une clé
 * inconnue, traitée comme « pas de borne » plutôt que comme une erreur : une
 * période absente ne doit pas vider un écran.
 *
 * Les périodes longues sont ramenées à minuit, pour que deux appels le même
 * jour donnent la même borne et que la courbe ne frémisse pas d'un point
 * entre deux rendus. Les périodes intraday gardent l'heure : leur fenêtre
 * glisse, c'est tout leur objet.
 */
export function debutPeriode(cle, maintenant = new Date()) {
  const periode = periodeParCle(cle)
  if (!periode) return null

  if (periode.intraday) {
    return new Date(maintenant.getTime() - periode.jours * 24 * 60 * 60 * 1000)
  }
  if (periode.mois === null) return null

  const debut = reculerDeMois(maintenant, periode.mois)
  debut.setHours(0, 0, 0, 0)
  return debut
}
