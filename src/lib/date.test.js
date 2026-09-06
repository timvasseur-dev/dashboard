import { describe, it, expect } from 'vitest'
import { parseDateImport } from './date.js'

describe('parseDateImport', () => {
  it('parse une date JJ/MM/AAAA', () => {
    expect(parseDateImport('05/03/2025', 'JJ/MM/AAAA')).toBe('2025-03-05')
  })

  it('parse une date déjà ISO', () => {
    expect(parseDateImport('2025-03-05', 'AAAA-MM-JJ')).toBe('2025-03-05')
  })

  it('retourne null pour une date qui ne correspond pas au format attendu', () => {
    expect(parseDateImport('2025-03-05', 'JJ/MM/AAAA')).toBeNull()
    expect(parseDateImport('05/03/2025', 'AAAA-MM-JJ')).toBeNull()
  })

  it('retourne null pour une chaîne vide', () => {
    expect(parseDateImport('', 'JJ/MM/AAAA')).toBeNull()
  })
})
