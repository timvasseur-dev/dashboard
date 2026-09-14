import { VERSION } from './schema.js'

/*
 * Une entrée par numéro de version de départ : `migrations[1]` transforme un
 * état v1 en v2, etc.
 */

// Recopiée depuis le semis de schema.js plutôt qu'importée, à dessein : une
// migration est une transformation figée dans le temps. Si le semis change
// encore, `migrations[5]` doit continuer à produire exactement un état v6, et
// non le dernier semis en date — sans quoi une migration ultérieure
// s'appliquerait sur une base qu'elle n'attend pas. Le suffixe de version est
// là pour qu'une table v7 ne puisse pas être confondue avec celle-ci.
//
// Une Map, pas un objet : `nom` vient de l'état, et une clé comme
// « constructor » sur un objet littéral renverrait une fonction héritée du
// prototype, donc une couleur invalide passée pour valide.
const COULEURS_INSTITUTION_V6 = new Map([
  ['BCI', '#465977'],
  ['Boursobank', '#995DAC'],
  ["Caisse d'Épargne", '#3FA4AB'],
  ['IBKR', '#B2B1E2'],
])

const migrations = {
  // v1 : watchlist { id, ticker, libelle, devise, note } — quasi-valorisable.
  // v2 : watchlist { id, ticker, libelle, conviction, horizon, zoneAchatMin,
  // zoneAchatMax, alertePrix, these, risques, favori } — idée de suivi, sans
  // aucun montant. `devise` est abandonnée, `note` devient `these`.
  1: (etat) => ({
    ...etat,
    watchlist: etat.watchlist.map(({ id, ticker, libelle, note }) => ({
      id,
      ticker,
      libelle,
      conviction: '',
      horizon: '',
      zoneAchatMin: null,
      zoneAchatMax: null,
      alertePrix: null,
      these: note ?? '',
      risques: '',
      favori: false,
    })),
  }),

  // v2 : une Position doit avoir un accountId correspondant à un compte
  // existant (cf. CLAUDE.md, correction du bug des positions orphelines).
  // Celles qui ne correspondent à aucun compte (accountId vide ou compte
  // supprimé) sont déplacées vers `positionsOrphelines`, jamais
  // supprimées : l'utilisateur décide de les rattacher ou de les effacer.
  2: (etat) => {
    const idsComptes = new Set(etat.accounts.map((c) => c.id))
    const positions = []
    const orphelines = [...(etat.positionsOrphelines ?? [])]
    for (const position of etat.positions) {
      if (position.accountId && idsComptes.has(position.accountId)) {
        positions.push(position)
      } else {
        orphelines.push(position)
      }
    }
    return { ...etat, positions, positionsOrphelines: orphelines }
  },

  // v3 : ajoute la traçabilité nécessaire à la synchro cloud (phase 4).
  // `appareilId` identifie ce navigateur, jamais recréé après coup ;
  // `dernierModification` à null tant qu'aucune mutation locale n'a encore
  // eu lieu depuis la migration (cf. store.js, qui le timestampe ensuite à
  // chaque écriture).
  3: (etat) => ({
    ...etat,
    dernierModification: etat.dernierModification ?? null,
    appareilId: etat.appareilId ?? crypto.randomUUID(),
  }),

  // v4 : phase 5, import bancaire — `transactions` (ajout seul, une entrée
  // par mouvement importé) et `profilsImport` (réglages de correspondance
  // CSV, un par forme de fichier bancaire).
  4: (etat) => ({
    ...etat,
    transactions: etat.transactions ?? [],
    profilsImport: etat.profilsImport ?? [],
  }),

  // v5 : la refonte visuelle remplace la famille de couleurs d'institution —
  // bleu, orange, violet et turquoise laissent place à une famille froide
  // accordée à la palette. Ces couleurs sont de la donnée, pas du style : sans
  // migration, un état déjà enregistré garderait l'ancienne famille
  // indéfiniment, puisque theme.css ne peut pas l'atteindre.
  //
  // Appariement par `nom` : les `id` sont des UUID tirés à la création de
  // l'état, différents d'un appareil à l'autre. Une institution inconnue de la
  // table garde sa couleur — on ne réattribue pas au hasard ce qu'on n'a pas
  // reconnu.
  5: (etat) => ({
    ...etat,
    institutions: etat.institutions.map((institution) => {
      const couleur = COULEURS_INSTITUTION_V6.get(institution.nom)
      return couleur ? { ...institution, couleur } : institution
    }),
  }),
}

/** Fait remonter un état vers la version courante, migration par migration. */
export function migrer(etat, versionCible = VERSION) {
  let courant = etat
  let version = courant.version ?? 1

  while (version < versionCible) {
    const migration = migrations[version]
    if (!migration) break
    courant = migration(courant)
    version += 1
  }

  return { ...courant, version: versionCible }
}
