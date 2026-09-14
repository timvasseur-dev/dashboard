import { describe, it, expect } from 'vitest'
import { parseMontantFr, formatEur, formatEurParts } from './money.js'

describe('parseMontantFr', () => {
  it('parse un montant négatif simple', () => {
    expect(parseMontantFr('-58')).toBe(-58)
  })

  it('parse une décimale virgule', () => {
    expect(parseMontantFr('-12,50')).toBe(-12.5)
  })

  it('retire un séparateur de milliers espace normale', () => {
    expect(parseMontantFr('-2 100,00')).toBe(-2100)
  })

  it('retire un séparateur de milliers insécable (U+00A0)', () => {
    expect(parseMontantFr('1 234,56')).toBe(1234.56)
  })

  it('retire un séparateur de milliers insécable fine (U+202F)', () => {
    expect(parseMontantFr('1 234,56')).toBe(1234.56)
  })

  it('gère un signe positif explicite', () => {
    expect(parseMontantFr('+150,00')).toBe(150)
  })

  it('retourne null pour une chaîne vide (colonne débit/crédit non renseignée)', () => {
    expect(parseMontantFr('')).toBeNull()
    expect(parseMontantFr('  ')).toBeNull()
  })

  it('retourne null pour une valeur illisible', () => {
    expect(parseMontantFr('abc')).toBeNull()
  })
})

describe('formatEurParts', () => {
  it('découpe le symbole € dans sa propre part', () => {
    const parts = formatEurParts(1234.56)
    const devises = parts.filter((part) => part.type === 'currency')

    expect(devises).toHaveLength(1)
    expect(devises[0].value).toBe('€')
  })

  /* L'invariant qui compte : colorer le € à part ne doit pas changer le
   * nombre affiché. Si `formatEur` et `formatEurParts` divergeaient, le total
   * en tête ne dirait plus la même chose que le reste de l'application. */
  it('recollé, donne exactement formatEur', () => {
    for (const montant of [0, 1234.56, -58, 1000000, 0.004]) {
      expect(formatEurParts(montant).map((part) => part.value).join('')).toBe(formatEur(montant))
    }
  })
})
