import { describe, it, expect } from 'vitest'
import { consolider } from './portfolio.js'

const institutions = [{ id: 'i1', nom: 'Test', couleur: '#000' }]

const comptes = {
  courant: { id: 'c1', institutionId: 'i1', libelle: 'Courant', type: 'courant', devise: 'EUR' },
  livret: { id: 'c2', institutionId: 'i1', libelle: 'Livret A', type: 'epargne', devise: 'EUR' },
  cto: { id: 'c3', institutionId: 'i1', libelle: 'CTO', type: 'cto', devise: 'USD' },
}

const consoliderAvec = ({ accounts = [], balances = {}, positions = [], quotes = {}, fx = {} }) =>
  consolider({ institutions, accounts, balances, positions, quotes, fx })

describe('consolider — classes d’actif', () => {
  it('range le cash non investi d’un CTO dans Cash, pas dans Titres', () => {
    const resultat = consoliderAvec({
      accounts: [comptes.courant, comptes.cto],
      balances: { c1: { montant: 1000 }, c3: { montant: 200 } },
      fx: { 'USD/EUR': { taux: 0.9 } },
    })

    expect(resultat.parClasse.cash).toBe(1180) // 1000 € + 200 $ × 0,9
    expect(resultat.parClasse.titres).toBe(0)
  })

  it('laisse Titres égal à la seule valorisation des positions', () => {
    const resultat = consoliderAvec({
      accounts: [comptes.cto],
      balances: { c3: { montant: 500 } },
      positions: [{ id: 'p1', accountId: 'c3', ticker: 'IBIT', quantite: 10, pru: 40, devise: 'USD' }],
      quotes: { IBIT: { prix: 50, devise: 'USD' } },
      fx: { 'USD/EUR': { taux: 0.9 } },
    })

    expect(resultat.parClasse.titres).toBe(450) // 10 × 50 $ × 0,9, et rien du solde
    expect(resultat.parClasse.cash).toBe(450)
    expect(resultat.totalEur).toBe(900)
  })

  it('garde le solde d’enveloppe détaillé à part, hors des comptes courants', () => {
    const resultat = consoliderAvec({
      accounts: [comptes.courant, comptes.livret, comptes.cto],
      balances: { c1: { montant: 10 }, c2: { montant: 20 }, c3: { montant: 30 } },
      fx: { 'USD/EUR': { taux: 1 } },
    })

    expect(resultat.comptesCash.map((l) => l.compte.id)).toEqual(['c1'])
    expect(resultat.comptesEpargne.map((l) => l.compte.id)).toEqual(['c2'])
    expect(resultat.comptesEnveloppe.map((l) => l.compte.id)).toEqual(['c3'])
  })
})

describe('consolider — montants non convertis', () => {
  // Sans taux, un solde en dollars vaut null : il sortait du total sans
  // apparaître nulle part, n'étant ni une position ni un cours manquant.
  it('signale un solde en dollars que faute de taux on ne peut pas convertir', () => {
    const resultat = consoliderAvec({
      accounts: [comptes.courant, comptes.cto],
      balances: { c1: { montant: 1000 }, c3: { montant: 200 } },
      fx: {},
    })

    expect(resultat.totalEur).toBe(1000)
    expect(resultat.montantsNonConvertis).toEqual([{ libelle: 'CTO', devise: 'USD' }])
    expect(resultat.coursManquants).toEqual([])
  })

  it('distingue une position sans cours d’une position non convertible', () => {
    const resultat = consoliderAvec({
      accounts: [comptes.cto],
      positions: [
        { id: 'p1', accountId: 'c3', ticker: 'SANS', quantite: 1, pru: 1, devise: 'USD' },
        { id: 'p2', accountId: 'c3', ticker: 'IBIT', quantite: 10, pru: 40, devise: 'USD' },
      ],
      quotes: { IBIT: { prix: 50, devise: 'USD' } },
      fx: {},
    })

    expect(resultat.coursManquants.map((p) => p.ticker)).toEqual(['SANS'])
    expect(resultat.montantsNonConvertis).toEqual([{ libelle: 'IBIT', devise: 'USD' }])
    expect(resultat.totalEur).toBe(0)
  })

  it('ne signale rien quand tout se convertit', () => {
    const resultat = consoliderAvec({
      accounts: [comptes.courant],
      balances: { c1: { montant: 1000 } },
    })

    expect(resultat.montantsNonConvertis).toEqual([])
  })
})
