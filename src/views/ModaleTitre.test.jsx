import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { remplacerEtat } from '../data/store.js'
import { ouvrirTitre, fermerTitre } from '../data/modaleTitre.js'
import { etatVide, VERSION } from '../data/schema.js'
import ModaleTitre from './ModaleTitre.jsx'

// Intl sépare les milliers par une espace insécable fine (U+202F), invisible
// dans le source d'un test : on normalise, pour que les chaînes attendues
// ci-dessous restent des chaînes qu'on peut lire et retaper.
const lisible = (html) => html.replace(/[\u202f\u00a0]/g, ' ')

/*
 * Rendu en chaîne : les effets ne s'exécutent pas, donc aucun appel réseau
 * n'est déclenché et la courbe reste à l'état « chargement ». Ce qui est
 * vérifié ici, c'est l'assemblage et les valeurs — pas le chargement.
 */

const POSITION = { id: 'p1', accountId: 'c1', ticker: 'IBIT', quantite: 10, pru: 40, devise: 'USD' }

const SUIVI = {
  id: 's1',
  ticker: 'ASML.AS',
  libelle: 'ASML',
  conviction: 'forte',
  horizon: 'long',
  zoneAchatMin: 600,
  zoneAchatMax: 650,
  these: 'monopole EUV',
  risques: 'cyclicité',
  favori: true,
}

function etatDeTest() {
  return {
    ...etatVide(),
    version: VERSION,
    quotes: {
      IBIT: { prix: 50, devise: 'USD', nom: 'iShares Bitcoin Trust', variationJour: 1.5, horodatage: '2026-09-13T00:00:00.000Z' },
    },
    fx: { 'USD/EUR': { taux: 0.9, horodatage: '2026-09-13T00:00:00.000Z' } },
  }
}

describe('modale par titre', () => {
  beforeEach(() => {
    remplacerEtat(etatDeTest())
  })

  afterEach(() => {
    fermerTitre()
  })

  it('ne rend rien tant qu’aucun titre n’est ouvert', () => {
    expect(renderToStaticMarkup(<ModaleTitre />)).toBe('')
  })

  it('montre le cours, la variation du jour et ce qu’on détient', () => {
    ouvrirTitre({ ticker: 'IBIT', position: POSITION, libelle: 'iShares Bitcoin Trust' })
    const html = lisible(renderToStaticMarkup(<ModaleTitre />))

    expect(html).toContain('iShares Bitcoin Trust')
    expect(html).toContain('+1,5 % aujourd’hui')
    expect(html).toContain('Plus-value latente')
    // 10 × 50 $ × 0,9 = 450 €, revient 10 × 40 $ × 0,9 = 360 €
    expect(html).toContain('450,00')
    expect(html).toContain('90,00')
  })

  it('montre la thèse et la zone d’achat d’une idée de suivi', () => {
    ouvrirTitre({ ticker: 'ASML.AS', suivi: SUIVI, libelle: 'ASML' })
    const html = lisible(renderToStaticMarkup(<ModaleTitre />))

    expect(html).toContain('monopole EUV')
    expect(html).toContain('600')
    expect(html).toContain('650')
    // Pas de cours en cache pour ce ticker : on le dit.
    expect(html).toContain('Aucun cours connu')
  })
})
