/*
 * Lecture de `etat.historique`. Ce module ne fait que lire : l'historique est
 * en ajout seul (cf. CLAUDE.md § 3), le store y pousse en fin de tableau et
 * c'est ici qu'on remet les instantanés en ordre pour les afficher.
 *
 * Pourquoi trier à la lecture plutôt que de se fier à l'ordre du tableau :
 * `historique.at(-1)` n'est « le dernier » que si rien n'a jamais été ajouté
 * dans le désordre. Dès qu'on saisit un instantané passé, ou qu'un état
 * arrive de la synchro d'un autre appareil, l'index -1 désigne le dernier
 * ajouté, pas le plus récent.
 */

/** Jour local d'un horodatage, en `AAAA-MM-JJ`. Local et non UTC : à Nouméa,
 * un instantané pris à 9 h tombe la veille en temps universel, et se
 * retrouverait rangé au mauvais jour. */
function jourLocal(date) {
  const mois = String(date.getMonth() + 1).padStart(2, '0')
  const jour = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mois}-${jour}`
}

/** Instantanés triés par date, un seul par jour — le plus tardif du jour
 * gagne, c'est celui qui reflète l'état le plus complet de la journée. */
export function serieHistorique(historique) {
  const parJour = new Map()

  for (const instantane of historique) {
    const horodatage = new Date(instantane.date).getTime()
    if (Number.isNaN(horodatage)) continue

    const jour = jourLocal(new Date(instantane.date))
    const retenu = parJour.get(jour)
    if (!retenu || horodatage > new Date(retenu.date).getTime()) {
      parJour.set(jour, instantane)
    }
  }

  return [...parJour.values()].sort((a, b) => new Date(a.date) - new Date(b.date))
}

/** Instantané le plus récent, par date et jamais par position dans le
 * tableau. `null` si l'historique est vide. */
export function dernierInstantane(historique) {
  let dernier = null
  for (const instantane of historique) {
    const horodatage = new Date(instantane.date).getTime()
    if (Number.isNaN(horodatage)) continue
    if (!dernier || horodatage > new Date(dernier.date).getTime()) dernier = instantane
  }
  return dernier
}

/** Y a-t-il déjà un instantané portant la date du jour ? Sert à n'en écrire
 * qu'un par jour au démarrage de l'application. */
export function instantaneDuJour(historique, maintenant = new Date()) {
  const aujourdhui = jourLocal(maintenant)
  return historique.some((instantane) => {
    const date = new Date(instantane.date)
    return !Number.isNaN(date.getTime()) && jourLocal(date) === aujourdhui
  })
}

/** Points de la série à tracer sur la période. `debut` à `null` : tout. */
export function pointsSurPeriode(serie, debut) {
  if (!debut) return serie
  return serie.filter((instantane) => new Date(instantane.date) >= debut)
}

/**
 * Variation entre le début de la période et le dernier instantané connu.
 *
 * Renvoie `null` — et jamais une variation de zéro — dans les trois cas où
 * la réponse honnête est « je ne sais pas » : série vide, aucun point au
 * début de la période demandée, ou un seul point en tout. Une courbe plate
 * et un « +0,00 € » se ressemblent trop pour qu'on laisse le second passer
 * pour une mesure.
 */
export function variationSurPeriode(serie, debut) {
  if (serie.length < 2) return null

  const arrivee = serie[serie.length - 1]
  const depart = debut ? derniereAvant(serie, debut) : serie[0]
  if (!depart || depart === arrivee) return null

  const montant = arrivee.totalEur - depart.totalEur
  return {
    depart,
    arrivee,
    montant,
    // Une base à zéro n'a pas de pourcentage : un patrimoine parti de rien
    // n'a pas progressé « de l'infini ».
    pourcentage: depart.totalEur === 0 ? null : (montant / depart.totalEur) * 100,
  }
}

/** Dernier instantané antérieur ou égal à la borne, `null` si la série ne
 * remonte pas jusque-là. */
function derniereAvant(serie, borne) {
  for (let i = serie.length - 1; i >= 0; i -= 1) {
    if (new Date(serie[i].date) <= borne) return serie[i]
  }
  return null
}
