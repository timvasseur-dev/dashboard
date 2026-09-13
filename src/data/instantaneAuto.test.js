import { describe, it, expect, beforeEach } from 'vitest'
import { etatCourant, remplacerEtat } from './store.js'
import { etatVide, VERSION } from './schema.js'
import { enregistrerInstantaneAutomatique } from './instantaneAuto.js'

const COMPTE_EUR = { id: 'c1', institutionId: 'i1', libelle: 'Courant', type: 'courant', devise: 'EUR' }
const COMPTE_USD = { id: 'c2', institutionId: 'i1', libelle: 'CTO', type: 'cto', devise: 'USD' }
const POSITION = { id: 'p1', accountId: 'c2', ticker: 'IBIT', quantite: 10, pru: 40, devise: 'USD' }

/** État de départ complet et cohérent : tout converti, aucun cours manquant. */
function etatComplet(surcharges = {}) {
  return {
    ...etatVide(),
    version: VERSION,
    accounts: [COMPTE_EUR, COMPTE_USD],
    balances: { c1: { montant: 1000 }, c2: { montant: 200 } },
    positions: [POSITION],
    quotes: { IBIT: { prix: 50, devise: 'USD', horodatage: new Date().toISOString() } },
    fx: { 'USD/EUR': { taux: 0.9, horodatage: new Date().toISOString() } },
    ...surcharges,
  }
}

describe('enregistrerInstantaneAutomatique', () => {
  beforeEach(() => {
    remplacerEtat(etatComplet())
  })

  it('écrit l’instantané du jour quand tout est connu', () => {
    expect(enregistrerInstantaneAutomatique()).toEqual({ ecrit: true })

    const historique = etatCourant().historique
    expect(historique).toHaveLength(1)
    expect(historique[0].origine).toBe('auto')
    expect(historique[0].totalEur).toBeCloseTo(1630, 6) // 1000 € + 180 € de cash + 450 € d'IBIT
  })

  it('n’en écrit qu’un par jour', () => {
    enregistrerInstantaneAutomatique()
    expect(enregistrerInstantaneAutomatique()).toEqual({ ecrit: false, raison: 'deja' })
    expect(etatCourant().historique).toHaveLength(1)
  })

  // Les trois refus. Chacun vaut mieux qu'un point faux : un total amputé se
  // lirait plus tard comme une baisse réelle du patrimoine.
  it('refuse d’écrire si un cours manque', () => {
    remplacerEtat(etatComplet({ quotes: {} }))
    expect(enregistrerInstantaneAutomatique()).toEqual({ ecrit: false, raison: 'cours' })
    expect(etatCourant().historique).toHaveLength(0)
  })

  it('refuse d’écrire si le taux USD/EUR manque', () => {
    remplacerEtat(etatComplet({ fx: {} }))
    expect(enregistrerInstantaneAutomatique()).toEqual({ ecrit: false, raison: 'taux' })
    expect(etatCourant().historique).toHaveLength(0)
  })

  it('refuse d’écrire sur un patrimoine encore vide', () => {
    remplacerEtat(etatComplet({ accounts: [], balances: {}, positions: [] }))
    expect(enregistrerInstantaneAutomatique()).toEqual({ ecrit: false, raison: 'vide' })
    expect(etatCourant().historique).toHaveLength(0)
  })

  it('ne touche pas aux instantanés déjà enregistrés', () => {
    const ancien = { date: '2026-01-05T09:00:00.000Z', totalEur: 900, tauxUsd: 0.92, origine: 'manuel' }
    remplacerEtat(etatComplet({ historique: [ancien] }))

    enregistrerInstantaneAutomatique()

    const historique = etatCourant().historique
    expect(historique).toHaveLength(2)
    expect(historique[0]).toEqual(ancien)
  })
})
