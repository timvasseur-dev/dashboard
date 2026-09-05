/**
 * Décide quoi faire entre l'état local et l'état distant, sans jamais
 * fusionner (cf. CLAUDE.md § « Sécurité » : pas de décision silencieuse sur
 * une donnée qu'on ne peut pas vérifier soi-même). Pur, aucune I/O — `local`
 * et `distant` n'ont besoin que de `dernierModification`/`appareilId`,
 * jamais du contenu déchiffré.
 *
 * - 'a-jour'    : rien n'a changé depuis la dernière synchro réussie.
 * - 'a-pousser' : seul cet appareil a des changements non synchronisés.
 * - 'a-tirer'   : seul un autre appareil a changé, aucune saisie locale en
 *                 jeu — sans risque d'adopter directement.
 * - 'conflit'   : les deux ont changé depuis la dernière synchro réussie —
 *                 à l'utilisateur de choisir, jamais de fusion automatique.
 */
export function comparerEtats(local, distant, derniereSyncReussie) {
  if (!distant) {
    return local.dernierModification ? 'a-pousser' : 'a-jour'
  }

  const localModifie = !derniereSyncReussie || (local.dernierModification ?? '') > derniereSyncReussie
  const distantDejaVu =
    distant.appareilId === local.appareilId || (derniereSyncReussie && distant.dernierModification <= derniereSyncReussie)
  const distantModifie = !distantDejaVu

  if (localModifie && distantModifie) return 'conflit'
  if (distantModifie) return 'a-tirer'
  if (localModifie) return 'a-pousser'
  return 'a-jour'
}
