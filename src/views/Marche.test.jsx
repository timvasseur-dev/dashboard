import { describe, it, expect, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { remplacerEtat, etatCourant } from '../data/store.js'
import { etatVide, VERSION } from '../data/schema.js'
import { cleMarche } from '../data/rafraichissement.js'
import { consolider } from '../lib/portfolio.js'
import Marche from './Marche.jsx'

// Intl sépare les milliers par une espace insécable fine (U+202F), invisible
// dans le source d'un test : on normalise, pour que les chaînes attendues
// ci-dessous restent des chaînes qu'on peut lire et retaper.
const lisible = (html) => html.replace(/[\u202f\u00a0]/g, ' ')

const COURS_INDICE = { prix: 7523.41, devise: 'EUR', nom: 'CAC 40', variationJour: -0.42, horodatage: '2026-09-13T00:00:00.000Z' }

function etatDeTest() {
  return {
    ...etatVide(),
    version: VERSION,
    quotes: { [cleMarche('^FCHI')]: COURS_INDICE },
  }
}

describe('écran Marché', () => {
  beforeEach(() => {
    remplacerEtat(etatDeTest())
  })

  it('liste les indicateurs suivis', () => {
    const html = lisible(renderToStaticMarkup(<Marche />))
    expect(html).toContain('S&amp;P 500')
    expect(html).toContain('CAC 40')
    expect(html).toContain('Or')
  })

  it('affiche un indice en points, jamais en euros', () => {
    const html = lisible(renderToStaticMarkup(<Marche />))
    expect(html).toContain('7 523,41')
    expect(html).not.toContain('7 523,41 €')
    expect(html).toContain('-0,42 %')
  })

  it('dit « indisponible » pour un indicateur sans cours', () => {
    expect(lisible(renderToStaticMarkup(<Marche />))).toContain('indisponible')
  })

  // La garantie structurelle du § 4 : un indicateur est rangé sous un préfixe,
  // et consolider() ne lit `quotes` que par le ticker d'une position réelle.
  it('n’entre jamais dans le patrimoine', () => {
    const etat = etatCourant()
    const { totalEur } = consolider({
      institutions: etat.institutions,
      accounts: etat.accounts,
      balances: etat.balances,
      positions: etat.positions,
      quotes: etat.quotes,
      fx: etat.fx,
    })
    expect(totalEur).toBe(0)
  })
})
