/*
 * Couleur d'une institution : pastille de section, segment d'anneau, barre de
 * part.
 *
 * Elle ne vient plus de l'état. `institution.couleur` y subsiste mais n'est
 * plus lu (cf. src/data/schema.js) : une couleur est une décision visuelle,
 * pas une donnée patrimoniale. La stocker obligeait à une migration pour
 * chaque retouche de teinte, et un appareil déjà migré ne voyait jamais la
 * correction suivante — c'est exactement ce qui est arrivé entre la deuxième
 * et la troisième série. Les valeurs sont dans src/styles/theme.css.
 *
 * L'appariement se fait sur le nom, seule clé stable : les `id` sont des UUID
 * tirés à la création de l'état, différents d'un appareil à l'autre. Renommer
 * une institution lui fait donc perdre sa couleur au profit du repli. Les
 * institutions sont une structure fixe en phase 2 (CLAUDE.md § 3), sans
 * écran de gestion : le compromis est assumé, et le repli est une couleur
 * pleine et visible, pas une absence.
 */

// Une Map et non un objet littéral : le nom vient de l'état, et une clé comme
// « constructor » sur un objet renverrait une fonction héritée du prototype,
// donc une couleur invalide passée pour valide.
const PAR_NOM = new Map([
  ['BCI', 'var(--inst-bci)'],
  ['Boursobank', 'var(--inst-boursobank)'],
  ["Caisse d'Épargne", 'var(--inst-caisse-epargne)'],
  ['IBKR', 'var(--inst-ibkr)'],
])

/** Institution non reconnue. Gris neutre : il dit « pas d'identité
 * attribuée » et ne se confond avec aucune des quatre. */
export const COULEUR_INCONNUE = 'var(--inst-autre)'

/** Tous les tokens que `couleurInstitution` peut renvoyer.
 *
 * Exporté pour le test qui vérifie qu'ils existent dans theme.css : un `var()`
 * non défini ne lève rien, il peint transparent. Une pastille invisible ne se
 * signale d'aucune manière, ni à l'exécution ni à la compilation. */
export const TOKENS = [...PAR_NOM.values(), COULEUR_INCONNUE]

/** Couleur d'une institution, par son nom. */
export function couleurInstitution(nom) {
  return PAR_NOM.get(nom) ?? COULEUR_INCONNUE
}
