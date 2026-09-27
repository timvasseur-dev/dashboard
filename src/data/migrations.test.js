import { describe, it, expect } from 'vitest'
import { migrer } from './migrations.js'
import { VERSION } from './schema.js'

/*
 * Les migrations n'étaient couvertes par aucun test.
 *
 * Ce fichier vérifie la mécanique : appariement, conservation de l'ordre et
 * des autres clés, chaînage des versions. Pas les règles visuelles — les
 * couleurs que `migrations[5]` écrit ne sont plus lues depuis qu'elles sont
 * passées dans theme.css, et ce sont les tokens qui sont désormais gardés,
 * dans src/views/couleursInstitution.test.jsx.
 *
 * Les valeurs attendues ci-dessous restent vérifiées pour une autre raison :
 * une migration est figée dans le temps, et personne ne doit la réécrire
 * discrètement.
 */

/** État v5 minimal : les seules clés que les migrations traversent. */
function etatV5(institutions) {
  return {
    version: 5,
    institutions,
    accounts: [],
    positions: [],
    positionsOrphelines: [],
    watchlist: [],
    transactions: [],
    profilsImport: [],
  }
}

const INSTITUTIONS_V5 = [
  { id: 'a', nom: 'BCI', couleur: '#4c8dff' },
  { id: 'b', nom: 'Boursobank', couleur: '#ffa94d' },
  { id: 'c', nom: "Caisse d'Épargne", couleur: '#845ef7' },
  { id: 'd', nom: 'IBKR', couleur: '#20c997' },
]

describe('migration v5 → v6 : couleurs d’institution', () => {
  it('réécrit les quatre institutions connues, appariées par nom', () => {
    const etat = migrer(etatV5(INSTITUTIONS_V5), 6)

    expect(etat.institutions.map((institution) => institution.couleur)).toEqual([
      '#465977',
      '#995DAC',
      '#3FA4AB',
      '#B2B1E2',
    ])
  })

  it('conserve les id, les noms et l’ordre', () => {
    const etat = migrer(etatV5(INSTITUTIONS_V5), 6)

    expect(etat.institutions.map((institution) => institution.id)).toEqual(['a', 'b', 'c', 'd'])
    expect(etat.institutions.map((institution) => institution.nom)).toEqual([
      'BCI',
      'Boursobank',
      "Caisse d'Épargne",
      'IBKR',
    ])
  })

  it('laisse intacte une institution inconnue de la table', () => {
    const etat = migrer(etatV5([{ id: 'z', nom: 'Banque inconnue', couleur: '#123456' }]), 6)

    expect(etat.institutions[0]).toEqual({ id: 'z', nom: 'Banque inconnue', couleur: '#123456' })
  })

  it('ne perd aucune autre clé de l’état', () => {
    const etat = migrer({ ...etatV5(INSTITUTIONS_V5), balances: { c1: { montant: 42 } } }, 6)

    expect(etat.balances).toEqual({ c1: { montant: 42 } })
    expect(etat.version).toBe(6)
  })

  it('ne retouche pas un état déjà en v6', () => {
    const dejaMigre = { ...etatV5(INSTITUTIONS_V5), version: 6 }
    dejaMigre.institutions = [{ id: 'a', nom: 'BCI', couleur: '#choisi-a-la-main' }]

    const etat = migrer(dejaMigre, 6)

    expect(etat.institutions[0].couleur).toBe('#choisi-a-la-main')
  })
})

describe('chaîne complète des migrations', () => {
  /** État v1 : watchlist encore quasi-valorisable, pas de traçabilité synchro. */
  const etatV1 = () => ({
    version: 1,
    institutions: [{ id: 'd', nom: 'IBKR', couleur: '#20c997' }],
    accounts: [{ id: 'c1', institutionId: 'd', libelle: 'CTO', type: 'cto', devise: 'USD' }],
    positions: [{ id: 'p1', accountId: 'c1', ticker: 'IBIT', quantite: 10, pru: 40, devise: 'USD' }],
    watchlist: [{ id: 'w1', ticker: 'GOLD.PA', libelle: 'Or', devise: 'EUR', note: 'à surveiller' }],
    balances: {},
    quotes: {},
    fx: {},
    historique: [],
  })

  it('remonte un état v1 jusqu’à la version courante', () => {
    const etat = migrer(etatV1())

    expect(etat.version).toBe(VERSION)
    // v1 : `note` devient `these`, `devise` disparaît de la watchlist
    expect(etat.watchlist[0].these).toBe('à surveiller')
    expect(etat.watchlist[0]).not.toHaveProperty('devise')
    // v2 : la position a un compte existant, elle n'est pas orpheline
    expect(etat.positions).toHaveLength(1)
    expect(etat.positionsOrphelines).toEqual([])
    // v3 : traçabilité de synchro assignée
    expect(typeof etat.appareilId).toBe('string')
    // v4 : import bancaire
    expect(etat.transactions).toEqual([])
    // v5 réécrit la couleur d'institution, v6 la retire
    expect(etat.institutions[0]).toEqual({ id: 'd', nom: 'IBKR' })
    // v6 : ordres exécutés
    expect(etat.ordres).toEqual([])
  })
})

describe('migration v6 → v7 : ordres, fin de la couleur d’institution', () => {
  const etatV6 = () => ({ ...etatV5(INSTITUTIONS_V5), version: 6 })

  it('retire `couleur` de chaque institution, sans toucher au reste', () => {
    const etat = migrer(etatV6(), 7)

    expect(etat.institutions).toEqual([
      { id: 'a', nom: 'BCI' },
      { id: 'b', nom: 'Boursobank' },
      { id: 'c', nom: "Caisse d'Épargne" },
      { id: 'd', nom: 'IBKR' },
    ])
    expect(etat.version).toBe(7)
  })

  it('ajoute une liste d’ordres vide', () => {
    expect(migrer(etatV6(), 7).ordres).toEqual([])
  })

  it('garde des ordres déjà présents', () => {
    const ordre = { id: 'o1', sens: 'achat' }
    expect(migrer({ ...etatV6(), ordres: [ordre] }, 7).ordres).toEqual([ordre])
  })
})
