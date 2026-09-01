import { ageLisible } from '../lib/date.js'

/** Âge d'une valeur horodatée (cours, taux), affiché en clair. */
export default function Age({ horodatage }) {
  const age = ageLisible(horodatage)
  if (!age) return null
  return <span className="age">{age}</span>
}
