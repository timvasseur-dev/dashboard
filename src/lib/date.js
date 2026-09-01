/** Âge lisible d'un horodatage ISO, en français, à la précision la plus
 * grossière qui reste honnête — un cours vieux de plusieurs jours doit se
 * voir (cf. CLAUDE.md § « Le front »). */
export function ageLisible(horodatage) {
  if (!horodatage) return null
  const secondes = Math.max(0, (Date.now() - new Date(horodatage).getTime()) / 1000)
  if (secondes < 60) return "à l'instant"
  const minutes = Math.round(secondes / 60)
  if (minutes < 60) return `il y a ${minutes} min`
  const heures = Math.round(minutes / 60)
  if (heures < 24) return `il y a ${heures} h`
  const jours = Math.round(heures / 24)
  return `il y a ${jours} j`
}

/** Millisecondes écoulées depuis un horodatage ISO, +Infinity si absent —
 * pour comparer à un seuil de fraîcheur sans cas particulier. */
export function ageMs(horodatage) {
  if (!horodatage) return Infinity
  return Date.now() - new Date(horodatage).getTime()
}
