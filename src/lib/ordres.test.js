import { describe, it, expect } from 'vitest'
import {
  erreurOrdre,
  apresOrdre,
  appliquerOrdre,
  plusValueRealisee,
  peutAnnuler,
  annulerOrdre,
  ordresRecents,
  plusValuesParAnnee,
} from './ordres.js'

// Valeurs manifestement fictives (cf. CLAUDE.md § 1).
const LIGNE = { id: 'p1', accountId: 'c1', ticker: 'TEST', isin: 'XX0000000000', quantite: 10, pru: 100, devise: 'USD' }
const NOUVELLE = { ...LIGNE, id: 'p2', quantite: 0, pru: 0 }
const COMPTES = [{ id: 'c1' }]

/** Ordre tel que le store le range : données saisies + photo de la ligne. */
function ordre(id, position, donnees) {
  const { photo } = appliquerOrdre(position, donnees)
  const { accountId, ticker, isin, devise } = position
  return { id, positionId: position.id, accountId, ticker, isin, devise, ...donnees, ...photo }
}

describe('appliquerOrdre — achat', () => {
  it('ouvre une ligne : le PRU est le cours, frais compris', () => {
    const { position, photo } = appliquerOrdre(NOUVELLE, { sens: 'achat', quantite: 4, cours: 50, frais: 2 })
    expect(photo).toEqual({ quantiteAvant: 0, pruAvant: 0 })
    expect(position.quantite).toBe(4)
    expect(position.pru).toBeCloseTo(50.5)
  })

  it('renforce une ligne au prix moyen pondéré', () => {
    // 10 × 100 + 10 × 200 + 10 de frais, sur 20 titres
    const { position } = appliquerOrdre(LIGNE, { sens: 'achat', quantite: 10, cours: 200, frais: 10 })
    expect(position.quantite).toBe(20)
    expect(position.pru).toBeCloseTo(150.5)
    expect(position.id).toBe('p1')
  })

  it('enchaîne deux achats sans dériver', () => {
    const premier = appliquerOrdre(NOUVELLE, { sens: 'achat', quantite: 1, cours: 100, frais: 0 }).position
    const second = appliquerOrdre(premier, { sens: 'achat', quantite: 3, cours: 60, frais: 0 }).position
    expect(second.quantite).toBe(4)
    expect(second.pru).toBeCloseTo(70)
  })
})

describe('appliquerOrdre — vente', () => {
  it('réduit la quantité sans toucher au PRU', () => {
    const { position } = appliquerOrdre(LIGNE, { sens: 'vente', quantite: 4, cours: 130, frais: 1 })
    expect(position.quantite).toBe(6)
    expect(position.pru).toBe(100)
  })

  it('solde la ligne quand tout est vendu', () => {
    expect(appliquerOrdre(LIGNE, { sens: 'vente', quantite: 10, cours: 90, frais: 0 }).position).toBeNull()
  })

  it('solde une ligne fractionnaire malgré l’arrondi des flottants', () => {
    const ligne = { ...LIGNE, quantite: 0.1 + 0.2 }
    expect(appliquerOrdre(ligne, { sens: 'vente', quantite: 0.3, cours: 90, frais: 0 }).position).toBeNull()
  })

  it('ne laisse pas de résidu d’arrondi dans la quantité', () => {
    const ligne = { ...LIGNE, quantite: 0.1 }
    expect(appliquerOrdre(ligne, { sens: 'achat', quantite: 0.2, cours: 90, frais: 0 }).position.quantite).toBe(0.3)
  })

  it('refuse de vendre plus que détenu', () => {
    expect(() => appliquerOrdre(LIGNE, { sens: 'vente', quantite: 11, cours: 90, frais: 0 })).toThrow(/supérieure/)
  })
})

describe('erreurOrdre', () => {
  it('refuse une quantité, un cours ou des frais invalides', () => {
    const base = { sens: 'achat', quantite: 1, cours: 1, frais: 0 }
    expect(erreurOrdre(LIGNE, base)).toBeNull()
    expect(erreurOrdre(LIGNE, { ...base, quantite: 0 })).toMatch(/quantité/)
    expect(erreurOrdre(LIGNE, { ...base, cours: Number.NaN })).toMatch(/cours/)
    expect(erreurOrdre(LIGNE, { ...base, frais: -1 })).toMatch(/frais/)
  })

  it('refuse une vente sur une ligne qui n’existe pas encore', () => {
    expect(erreurOrdre(NOUVELLE, { sens: 'vente', quantite: 1, cours: 1, frais: 0 })).toMatch(/supérieure/)
  })
})

describe('plusValueRealisee', () => {
  it('vaut l’écart au PRU, frais de vente déduits', () => {
    const vente = ordre('o1', LIGNE, { sens: 'vente', quantite: 4, cours: 130, frais: 1 })
    expect(plusValueRealisee(vente)).toBeCloseTo(119) // 4 × (130 − 100) − 1
  })

  it('peut être négative', () => {
    const vente = ordre('o1', LIGNE, { sens: 'vente', quantite: 10, cours: 90, frais: 0 })
    expect(plusValueRealisee(vente)).toBeCloseTo(-100)
  })

  it('n’existe pas pour un achat', () => {
    expect(plusValueRealisee(ordre('o1', LIGNE, { sens: 'achat', quantite: 1, cours: 1, frais: 0 }))).toBeNull()
  })
})

describe('apresOrdre', () => {
  it('retrouve la ligne produite, à partir de l’ordre seul', () => {
    const donnees = { sens: 'achat', quantite: 10, cours: 200, frais: 10 }
    const attendu = appliquerOrdre(LIGNE, donnees).position
    const apres = apresOrdre(ordre('o1', LIGNE, donnees))
    expect(apres.quantite).toBe(attendu.quantite)
    expect(apres.pru).toBeCloseTo(attendu.pru)
  })
})

describe('peutAnnuler / annulerOrdre', () => {
  const achat = ordre('o1', LIGNE, { sens: 'achat', quantite: 10, cours: 200, frais: 10 })
  const apresAchat = appliquerOrdre(LIGNE, { sens: 'achat', quantite: 10, cours: 200, frais: 10 }).position

  it('annule le dernier ordre d’une ligne restée telle quelle', () => {
    expect(peutAnnuler(achat, { ordres: [achat], positions: [apresAchat], accounts: COMPTES })).toBe(true)
    expect(annulerOrdre(achat, apresAchat)).toEqual(LIGNE)
  })

  it('refuse un ordre qui n’est pas le dernier de sa ligne', () => {
    const vente = ordre('o2', apresAchat, { sens: 'vente', quantite: 1, cours: 1, frais: 0 })
    expect(peutAnnuler(achat, { ordres: [achat, vente], positions: [apresAchat], accounts: COMPTES })).toBe(false)
  })

  it('ignore les ordres des autres lignes', () => {
    const autre = { ...achat, id: 'o9', positionId: 'p9' }
    expect(peutAnnuler(achat, { ordres: [achat, autre], positions: [apresAchat], accounts: COMPTES })).toBe(true)
  })

  it('refuse si la ligne a été retouchée à la main depuis', () => {
    const retouchee = { ...apresAchat, pru: 140 }
    expect(peutAnnuler(achat, { ordres: [achat], positions: [retouchee], accounts: COMPTES })).toBe(false)
  })

  it('refuse si le compte a été supprimé', () => {
    expect(peutAnnuler(achat, { ordres: [achat], positions: [apresAchat], accounts: [] })).toBe(false)
  })

  it('recrée une ligne soldée sous son identifiant d’origine', () => {
    const venteTotale = ordre('o3', LIGNE, { sens: 'vente', quantite: 10, cours: 90, frais: 0 })
    expect(peutAnnuler(venteTotale, { ordres: [venteTotale], positions: [], accounts: COMPTES })).toBe(true)
    expect(annulerOrdre(venteTotale, undefined)).toEqual(LIGNE)
  })

  it('retire la ligne que l’ordre avait ouverte', () => {
    const ouverture = ordre('o4', NOUVELLE, { sens: 'achat', quantite: 2, cours: 10, frais: 0 })
    expect(annulerOrdre(ouverture, { ...NOUVELLE, quantite: 2, pru: 10 })).toBeNull()
  })
})

describe('ordresRecents', () => {
  it('trie par date décroissante, le dernier saisi d’abord à date égale', () => {
    const liste = [
      { id: 'a', date: '2026-03-01' },
      { id: 'b', date: '2026-05-01' },
      { id: 'c', date: '2026-03-01' },
    ]
    expect(ordresRecents(liste).map((o) => o.id)).toEqual(['b', 'c', 'a'])
  })
})

describe('plusValuesParAnnee', () => {
  // Une unité vendue sur une ligne à 100 de PRU : la plus-value vaut cours − 100.
  const vente = (id, date, devise, cours) => ({ id, date, devise, sens: 'vente', quantite: 1, cours, frais: 0, pruAvant: 100 })
  const achat = { id: 'd', date: '2026-05-01', devise: 'EUR', sens: 'achat', quantite: 1, cours: 1, frais: 0 }
  const ordres = [
    vente('a', '2025-06-01', 'EUR', 150),
    vente('b', '2026-02-01', 'EUR', 120),
    vente('c', '2026-04-01', 'USD', 110),
    achat,
  ]

  it('regroupe par année et par devise, la plus récente d’abord', () => {
    const resultat = plusValuesParAnnee(ordres, 0.9)
    expect(resultat.map((r) => r.annee)).toEqual(['2026', '2025'])
    expect(resultat[0].parDevise).toEqual({ EUR: 20, USD: 10 })
    expect(resultat[0].totalEur).toBeCloseTo(29)
    expect(resultat[1].totalEur).toBeCloseTo(50)
  })

  it('ne donne pas de total EUR sans taux USD, plutôt qu’un total amputé', () => {
    const resultat = plusValuesParAnnee(ordres, null)
    expect(resultat[0].totalEur).toBeNull()
    expect(resultat[0].parDevise.USD).toBe(10)
    expect(resultat[1].totalEur).toBe(50)
  })

  it('renvoie une liste vide sans aucune vente', () => {
    expect(plusValuesParAnnee([achat], 0.9)).toEqual([])
  })
})
