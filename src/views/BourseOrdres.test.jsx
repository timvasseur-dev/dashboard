import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { basculerMasquage } from '../data/masquage.js'
import { etatVide } from '../data/schema.js'
import BourseOrdres, { OrdresTitre } from './BourseOrdres.jsx'

// Intl sépare les milliers par une espace insécable fine : on normalise pour
// garder des chaînes attendues lisibles (cf. ModaleTitre.test.jsx).
const lisible = (html) => html.replace(/[  ]/g, ' ')

// Valeurs manifestement fictives (cf. CLAUDE.md § 1).
const COMPTE = { id: 'c1', institutionId: 'i1', libelle: 'CTO', type: 'cto', devise: 'USD' }
const POSITION = { id: 'p1', accountId: 'c1', ticker: 'DEMO', isin: '', quantite: 5, pru: 100, devise: 'USD' }

const ordre = (id, sens, date, quantite, cours, quantiteAvant, pruAvant, frais = 0) => ({
  id, positionId: 'p1', accountId: 'c1', ticker: 'DEMO', isin: '', devise: 'USD',
  sens, date, quantite, cours, frais, quantiteAvant, pruAvant,
})

// Achat de 10 à 100, puis vente de 5 à 120 : 5 × 20 = +100 $ réalisés.
const ACHAT = ordre('o1', 'achat', '2026-02-01', 10, 100, 0, 0)
const VENTE = ordre('o2', 'vente', '2026-03-01', 5, 120, 10, 100)

function etat(changements = {}) {
  return {
    ...etatVide(),
    accounts: [COMPTE],
    positions: [POSITION],
    ordres: [ACHAT, VENTE],
    fx: { 'USD/EUR': { taux: 0.9, horodatage: '2026-09-13T00:00:00.000Z' } },
    ...changements,
  }
}

describe('section Ordres', () => {
  it('ne rend rien sans aucun ordre', () => {
    expect(renderToStaticMarkup(<BourseOrdres etat={etat({ ordres: [] })} />)).toBe('')
  })

  it('totalise l’année au taux du jour, en gardant la devise d’origine', () => {
    const html = lisible(renderToStaticMarkup(<BourseOrdres etat={etat()} />))
    expect(html).toContain('Plus-values réalisées 2026')
    expect(html).toContain('+100,00 $US')
    expect(html).toContain('+90,00 €')
    expect(html).toContain('total au taux du jour')
  })

  it('dit qu’il manque le taux plutôt que d’afficher un total amputé', () => {
    const html = lisible(renderToStaticMarkup(<BourseOrdres etat={etat({ fx: {} })} />))
    expect(html).toContain('sans taux USD/EUR')
    expect(html).not.toContain('total au taux du jour')
  })

  it('liste les ordres du plus récent au plus ancien, achat au coût frais compris', () => {
    const html = lisible(renderToStaticMarkup(<BourseOrdres etat={etat()} />))
    expect(html.indexOf('Vente DEMO')).toBeLessThan(html.indexOf('Achat DEMO'))
    expect(html).toContain('1 000,00 $US')
  })

  it('ne propose l’annulation que sur le dernier ordre de la ligne', () => {
    const html = renderToStaticMarkup(<BourseOrdres etat={etat()} />)
    expect(html.match(/>Annuler</g)).toHaveLength(1)
    expect(html.indexOf('>Annuler<')).toBeLessThan(html.indexOf('Achat DEMO'))
  })

  it('survit à un compte supprimé', () => {
    const html = renderToStaticMarkup(<BourseOrdres etat={etat({ accounts: [], positions: [] })} />)
    expect(html).toContain('compte supprimé')
    expect(html).not.toContain('>Annuler<')
  })

  it('masque quantités et plus-values quand l’œil est fermé, pas les cours', () => {
    basculerMasquage()
    try {
      const html = lisible(renderToStaticMarkup(<BourseOrdres etat={etat()} />))
      expect(html).not.toContain('+100,00 $US')
      expect(html).not.toContain('+90,00 €')
      expect(html).toContain('120,00 $US')
    } finally {
      basculerMasquage()
    }
  })
})

describe('ordres dans la fiche titre', () => {
  it('cumule la plus-value réalisée de la ligne', () => {
    const html = lisible(renderToStaticMarkup(<dl><OrdresTitre position={POSITION} ordres={[ACHAT, VENTE]} /></dl>))
    expect(html).toContain('Plus-value réalisée')
    expect(html).toContain('+100,00 $US')
    expect(html).toContain('Vente du 01/03/2026')
  })

  it('ne rend rien pour une ligne saisie à la main, sans ordre', () => {
    expect(renderToStaticMarkup(<OrdresTitre position={POSITION} ordres={[]} />)).toBe('')
  })
})
