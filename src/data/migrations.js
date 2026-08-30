import { VERSION } from './schema.js'

/*
 * Une entrée par numéro de version de départ : `migrations[1]` transforme un
 * état v1 en v2, etc. Vide aujourd'hui — la chaîne n'a rien à faire tant que
 * le modèle n'a pas changé — mais le point d'entrée existe pour ne pas perdre
 * les données à la première évolution.
 */
const migrations = {}

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
