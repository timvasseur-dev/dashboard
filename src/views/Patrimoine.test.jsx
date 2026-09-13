import { describe, it, expect, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { remplacerEtat } from '../data/store.js'
import { basculerMasquage } from '../data/masquage.js'
import { etatVide, VERSION } from '../data/schema.js'
import Patrimoine from './Patrimoine.jsx'

/*
 * Test de fumée du rendu : l'écran s'assemble à partir de six fichiers, et
 * une erreur d'accès à une donnée absente ne se verrait qu'à l'exécution.
 * Rend en chaîne, sans navigateur ni DOM — on vérifie qu'il ne casse pas et
 * que les valeurs affichées sont les bonnes, pas la mise en page.
 */

const INSTITUTION = { id: 'i1', nom: 'IBKR', couleur: '#20c997' }

function etatDeTest(surcharges = {}) {
  return {
    ...etatVide(),
    version: VERSION,
    institutions: [INSTITUTION],
    accounts: [
      { id: 'c1', institutionId: 'i1', libelle: 'Courant', type: 'courant', devise: 'EUR' },
      { id: 'c2', institutionId: 'i1', libelle: 'CTO', type: 'cto', devise: 'USD' },
    ],
    balances: { c1: { montant: 1000 }, c2: { montant: 200 } },
    positions: [{ id: 'p1', accountId: 'c2', ticker: 'IBIT', quantite: 10, pru: 40, devise: 'USD' }],
    quotes: { IBIT: { prix: 50, devise: 'USD', nom: 'iShares Bitcoin Trust', horodatage: '2026-09-13T00:00:00.000Z' } },
    fx: { 'USD/EUR': { taux: 0.9, horodatage: '2026-09-13T00:00:00.000Z' } },
    ...surcharges,
  }
}

const rendre = () => renderToStaticMarkup(<Patrimoine />)

describe('écran Patrimoine', () => {
  beforeEach(() => {
    remplacerEtat(etatDeTest())
  })

  it('affiche le total consolidé', () => {
    // 1000 € + 200 $ × 0,9 + 10 × 50 $ × 0,9 = 1 630 €
    expect(rendre()).toContain('1 630,00')
  })

  it('trace l’anneau de répartition avec un segment par classe servie', () => {
    const html = rendre()
    expect(html).toContain('stroke-dasharray')
    expect(html).toContain('Cash')
    expect(html).toContain('Titres')
  })

  it('dit qu’il manque des instantanés plutôt que de tracer une ligne plate', () => {
    const html = rendre()
    expect(html).toContain('La courbe se remplira')
    expect(html).not.toContain('<polyline')
  })

  it('trace la courbe dès deux instantanés', () => {
    remplacerEtat(
      etatDeTest({
        historique: [
          { date: '2026-09-11T09:00:00.000Z', totalEur: 1500, tauxUsd: 0.9, origine: 'auto' },
          { date: '2026-09-12T09:00:00.000Z', totalEur: 1600, tauxUsd: 0.9, origine: 'auto' },
        ],
      }),
    )
    expect(rendre()).toContain('<polyline')
  })

  it('signale un montant non converti au lieu de l’oublier en silence', () => {
    remplacerEtat(etatDeTest({ fx: {} }))
    const html = rendre()
    expect(html).toContain('Sans taux USD/EUR')
    expect(html).toContain('CTO')
  })

  it('remplace tous les montants par des points quand l’œil est fermé', () => {
    basculerMasquage()
    try {
      const html = rendre()
      expect(html).toContain('•••')
      expect(html).not.toContain('1 630,00')
    } finally {
      basculerMasquage()
    }
  })
})
