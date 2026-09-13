/*
 * Les deux axes de lecture du patrimoine — par classe d'actif, par
 * institution — sous une forme unique, pour que l'anneau de répartition et la
 * liste dépliable parlent toujours du même découpage.
 *
 * Présentation seulement : aucun calcul ici, les montants viennent de
 * `consolider()`.
 */

export const CLASSES = [
  { cle: 'cash', libelle: 'Cash', couleur: 'var(--classe-cash)' },
  { cle: 'epargne', libelle: 'Épargne', couleur: 'var(--classe-epargne)' },
  { cle: 'titres', libelle: 'Titres', couleur: 'var(--classe-titres)' },
]

export const AXES = [
  { cle: 'classes', libelle: 'Classes' },
  { cle: 'institutions', libelle: 'Institutions' },
]

/** Segments de l'axe demandé : `[{ cle, libelle, valeur, couleur }]`, dans
 * l'ordre d'affichage. Les institutions gardent leur couleur propre, définie
 * avec elles dans l'état. */
export function segmentsDe(axe, { parClasse, parInstitution, institutions }) {
  if (axe === 'institutions') {
    return institutions.map((institution) => ({
      cle: institution.id,
      libelle: institution.nom,
      valeur: parInstitution[institution.id] ?? 0,
      couleur: institution.couleur,
    }))
  }

  return CLASSES.map((classe) => ({ ...classe, valeur: parClasse[classe.cle] ?? 0 }))
}

/** Part d'un segment dans le total, entre 0 et 1. Un total nul ou négatif ne
 * se répartit pas : mieux vaut une barre vide qu'une part inventée. */
export function partDuTotal(valeur, totalEur) {
  if (!totalEur || totalEur <= 0) return 0
  return valeur / totalEur
}

/**
 * Groupes dépliables du même axe, avec leur contenu : `[{ cle, libelle,
 * couleur, valeur, plusValue, comptes, positions }]`.
 *
 * `plusValue` vaut `null` là où la notion n'a pas de sens — un groupe sans
 * position n'a pas de plus-value latente, et afficher « +0,00 € » laisserait
 * croire à un gain nul plutôt qu'à une absence de titres.
 */
export function groupesDe(axe, consolidation, institutions) {
  if (axe === 'institutions') {
    return institutions.map((institution) => ({
      cle: institution.id,
      libelle: institution.nom,
      couleur: institution.couleur,
      valeur: consolidation.parInstitution[institution.id] ?? 0,
      plusValue: consolidation.plusValueParInstitution[institution.id] ?? null,
      comptes: consolidation.comptesParInstitution[institution.id] ?? [],
      positions: consolidation.positionsParInstitution[institution.id] ?? [],
    }))
  }

  const { parClasse, comptesCash, comptesEpargne, comptesEnveloppe, positionsTitres, plusValueEur } = consolidation

  return [
    {
      ...CLASSES[0],
      valeur: parClasse.cash,
      plusValue: null,
      // Le cash d'enveloppe compte dans la classe, mais garde sa mention :
      // un solde de PEA ou de CTO n'est pas mobilisable comme un courant.
      comptes: [...comptesCash, ...comptesEnveloppe.map((ligne) => ({ ...ligne, note: 'cash non investi' }))],
      positions: [],
    },
    { ...CLASSES[1], valeur: parClasse.epargne, plusValue: null, comptes: comptesEpargne, positions: [] },
    { ...CLASSES[2], valeur: parClasse.titres, plusValue: plusValueEur, comptes: [], positions: positionsTitres },
  ]
}
