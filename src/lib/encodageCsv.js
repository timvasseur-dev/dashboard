/**
 * Décodage d'un export bancaire dont l'encodage n'est pas garanti. Détecté à
 * chaque import, jamais stocké dans un profil : deux exports de la même
 * banque n'ont pas nécessairement le même encodage (constaté sur de vrais
 * relevés Caisse d'Épargne, cf. CLAUDE.md § phase 5).
 */
const BOM_UTF8 = '﻿'

/** Décode des octets en texte : UTF-8 si valide, repli Windows-1252 sinon
 * (couvre aussi ISO-8859-1 pour l'usage visé, les deux ne diffèrent que sur
 * une plage de caractères peu probable dans un libellé bancaire). Retire le
 * BOM UTF-8 s'il est présent. Retourne aussi l'encodage retenu, affiché dans
 * l'aperçu d'import pour que l'utilisateur puisse vérifier la détection
 * plutôt que de la deviner (cf. CLAUDE.md § phase 5). */
export function decoderTexte(octets) {
  try {
    const texte = new TextDecoder('utf-8', { fatal: true }).decode(octets)
    return { texte: texte.startsWith(BOM_UTF8) ? texte.slice(1) : texte, encodage: 'UTF-8' }
  } catch {
    return { texte: new TextDecoder('windows-1252').decode(octets), encodage: 'Windows-1252' }
  }
}
