import { VERSION } from './schema.js'

/*
 * Une entrée par numéro de version de départ : `migrations[1]` transforme un
 * état v1 en v2, etc.
 */
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
