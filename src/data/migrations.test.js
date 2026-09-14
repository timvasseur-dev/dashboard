import { describe, it, expect } from 'vitest'
import { migrer } from './migrations.js'
import { VERSION } from './schema.js'

/*
 * Les migrations n'étaient couvertes par aucun test. Celle de la v5 réécrit de
 * la donnée déjà enregistrée sans qu'aucune saisie ne le déclenche, et son
 * erreur serait silencieuse : une couleur fausse ne lève pas d'exception, elle
 * s'affiche.
 */

// L'or de la palette. Aucune institution ne doit le porter : il signifie
// « repère d'interface », pas « cette institution-là ».
const OR = '#c9a05e'

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

  it('n’attribue l’or à aucune institution', () => {
    const etat = migrer(etatV5(INSTITUTIONS_V5), 6)

    for (const institution of etat.institutions) {
      expect(institution.couleur.toLowerCase()).not.toBe(OR)
    }
  })

  it('donne quatre couleurs distinctes', () => {
    const etat = migrer(etatV5(INSTITUTIONS_V5), 6)
    const couleurs = etat.institutions.map((institution) => institution.couleur)

    expect(new Set(couleurs).size).toBe(couleurs.length)
  })

  /*
   * Quatre hex différents ne suffisent pas : la première série en avait quatre,
   * et ses segments étaient indistinguables sur l'anneau comme sur les
   * pastilles de 8 px. Ce qui les séparait — la teinte seule — ne survit pas à
   * une tache de 8 px. La clarté, si.
   *
   * Luminance relative WCAG, triée : chaque couleur doit être au moins 30 %
   * plus claire que la précédente. La série rejetée donnait des rapports de
   * 1,67, 1,08 et 1,06 ; celle-ci donne 1,80, 1,74 et 1,52.
   */
  it('écarte les clartés, pas seulement les teintes', () => {
    const luminance = (hex) => {
      const canal = (deux) => {
        const c = parseInt(deux, 16) / 255
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
      }
      return (
        0.2126 * canal(hex.slice(1, 3)) + 0.7152 * canal(hex.slice(3, 5)) + 0.0722 * canal(hex.slice(5, 7))
      )
    }

    const etat = migrer(etatV5(INSTITUTIONS_V5), 6)
    const triees = etat.institutions.map((institution) => luminance(institution.couleur)).sort((a, b) => a - b)

    for (let i = 1; i < triees.length; i += 1) {
      expect(triees[i] / triees[i - 1]).toBeGreaterThan(1.3)
    }
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
    // v5 : couleur d'institution réécrite
    expect(etat.institutions[0].couleur).toBe('#B2B1E2')
  })
})
