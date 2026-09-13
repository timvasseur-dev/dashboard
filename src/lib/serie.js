/*
 * Projection d'une série de valeurs en coordonnées SVG. Aucune dépendance :
 * une courbe de clôtures journalières est une `polyline`, rien de plus
 * (cf. CLAUDE.md § 2).
 *
 * Les composants de graphique ne font que consommer ces chaînes ; tout le
 * calcul est ici, où il se teste sans rendu.
 */

const ARRONDI = 100 // deux décimales : assez pour l'œil, court dans le DOM

const arrondir = (nombre) => Math.round(nombre * ARRONDI) / ARRONDI

/** Valeurs extrêmes de la série, `null` si elle est vide. */
export function bornes(valeurs) {
  if (valeurs.length === 0) return null
  return { min: Math.min(...valeurs), max: Math.max(...valeurs) }
}

/**
 * Coordonnées `"x,y x,y …"` d'une polyline inscrite dans `largeur × hauteur`.
 *
 * Deux cas particuliers, tous deux réels :
 * - moins de deux valeurs : chaîne vide. Un point isolé ne fait pas une
 *   courbe, et à l'appelant de dire « pas assez de points » plutôt que de
 *   laisser croire à un tracé.
 * - toutes les valeurs égales : ligne à mi-hauteur. C'est le cas où
 *   `max - min` vaut zéro, et où une normalisation naïve diviserait par zéro.
 */
export function versPolyline(valeurs, { largeur, hauteur, marge = 2 }) {
  if (valeurs.length < 2) return ''

  const { min, max } = bornes(valeurs)
  const amplitude = max - min
  const utileX = largeur - marge * 2
  const utileY = hauteur - marge * 2

  return valeurs
    .map((valeur, index) => {
      const x = marge + (index / (valeurs.length - 1)) * utileX
      const y = amplitude === 0 ? hauteur / 2 : marge + utileY - ((valeur - min) / amplitude) * utileY
      return `${arrondir(x)},${arrondir(y)}`
    })
    .join(' ')
}

/** Mêmes points, refermés sur le bas du cadre : de quoi remplir l'aire sous
 * la courbe avec un `polygon`. Chaîne vide si la courbe l'est. */
export function versAire(valeurs, dimensions) {
  const ligne = versPolyline(valeurs, dimensions)
  if (!ligne) return ''

  const { largeur, hauteur, marge = 2 } = dimensions
  return `${marge},${hauteur} ${ligne} ${arrondir(largeur - marge)},${hauteur}`
}
