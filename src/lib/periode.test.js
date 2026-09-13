import { describe, it, expect } from 'vitest'
import { debutPeriode } from './periode.js'

const jour = (date) => [date.getFullYear(), date.getMonth() + 1, date.getDate()]

describe('debutPeriode', () => {
  it('recule d’un mois sur un cas ordinaire', () => {
    expect(jour(debutPeriode('1m', new Date(2026, 5, 15)))).toEqual([2026, 5, 15])
  })

  // Le piège : new Date(2026, 2, 31).setMonth(1) donne le 3 mars, pas le
  // 28 février — février n'a pas de 31, JS déborde sur le mois suivant.
  it('borne le 31 mars au dernier jour de février, sans déborder', () => {
    expect(jour(debutPeriode('1m', new Date(2026, 2, 31)))).toEqual([2026, 2, 28])
  })

  it('borne au 29 février une année bissextile', () => {
    expect(jour(debutPeriode('1m', new Date(2024, 2, 31)))).toEqual([2024, 2, 29])
  })

  it('borne le 31 mai au 30 avril', () => {
    expect(jour(debutPeriode('1m', new Date(2026, 4, 31)))).toEqual([2026, 4, 30])
  })

  it('borne aussi sur trois mois : 31 mai moins trois mois', () => {
    expect(jour(debutPeriode('3m', new Date(2026, 4, 31)))).toEqual([2026, 2, 28])
  })

  it('recule d’un an, 29 février compris', () => {
    expect(jour(debutPeriode('1a', new Date(2024, 1, 29)))).toEqual([2023, 2, 28])
  })

  it('ramène à minuit, pour que deux appels le même jour donnent la même borne', () => {
    const debut = debutPeriode('1m', new Date(2026, 5, 15, 23, 47, 12))
    expect([debut.getHours(), debut.getMinutes(), debut.getSeconds()]).toEqual([0, 0, 0])
  })

  it('ne borne pas la période « tout »', () => {
    expect(debutPeriode('tout', new Date(2026, 5, 15))).toBeNull()
  })

  it('traite une clé inconnue comme une absence de borne', () => {
    expect(debutPeriode('42a', new Date(2026, 5, 15))).toBeNull()
  })
})
