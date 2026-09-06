/**
 * Analyseur CSV écrit à la main (cf. CLAUDE.md § phase 5 : pas de dépendance
 * pour ça). Gère les champs entre guillemets, les guillemets échappés (`""`)
 * et un délimiteur au choix. Ne gère pas les retours à la ligne à l'intérieur
 * d'un champ guillemeté : absent des relevés bancaires visés par cette phase.
 */

/** Compare le nombre de `,` et de `;` sur une ligne (typiquement la ligne
 * d'en-tête) pour deviner le délimiteur. */
export function detecterDelimiteur(ligne) {
  const virgules = (ligne.match(/,/g) ?? []).length
  const pointsVirgules = (ligne.match(/;/g) ?? []).length
  return pointsVirgules > virgules ? ';' : ','
}

/** Découpe une ligne CSV en champs, guillemets gérés. */
export function parseLigneCsv(ligne, delimiteur) {
  const champs = []
  let champ = ''
  let dansGuillemets = false

  for (let i = 0; i < ligne.length; i++) {
    const c = ligne[i]
    if (dansGuillemets) {
      if (c === '"' && ligne[i + 1] === '"') {
        champ += '"'
        i++
      } else if (c === '"') {
        dansGuillemets = false
      } else {
        champ += c
      }
    } else if (c === '"') {
      dansGuillemets = true
    } else if (c === delimiteur) {
      champs.push(champ)
      champ = ''
    } else {
      champ += c
    }
  }
  champs.push(champ)
  return champs
}

/** Découpe un texte en lignes non vides, sans les parser en champs. */
export function decouperLignes(texte) {
  return texte.split(/\r\n|\n/).filter((ligne) => ligne.length > 0)
}

/** Parse un ensemble de lignes déjà découpées en tableaux de champs. */
export function parseLignes(lignes, delimiteur) {
  return lignes.map((ligne) => parseLigneCsv(ligne, delimiteur))
}
