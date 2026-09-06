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

/** Parse une date de relevé bancaire vers une date ISO (`AAAA-MM-JJ`).
 * `format` est choisi une fois par l'utilisateur dans le profil de
 * correspondance (cf. CLAUDE.md § phase 5 : ambigu, donc jamais deviné —
 * `03/04/2025` peut être le 3 avril ou le 4 mars selon la banque). */
export function parseDateImport(chaine, format) {
  const valeur = (chaine ?? '').trim()
  if (format === 'AAAA-MM-JJ') {
    return /^\d{4}-\d{2}-\d{2}$/.test(valeur) ? valeur : null
  }
  if (format === 'JJ/MM/AAAA') {
    const correspondance = valeur.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (!correspondance) return null
    const [, jour, mois, annee] = correspondance
    return `${annee}-${mois}-${jour}`
  }
  return null
}

/** Date ISO (`AAAA-MM-JJ`) affichée en français (`JJ/MM/AAAA`). */
export function formatDateAffichee(dateIso) {
  return new Date(dateIso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
