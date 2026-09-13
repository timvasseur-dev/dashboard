import { describe, it, expect } from 'vitest'
import { bornes, versPolyline, versAire } from './serie.js'

const cadre = { largeur: 100, hauteur: 40, marge: 0 }

describe('bornes', () => {
  it('donne le minimum et le maximum', () => {
    expect(bornes([3, 9, 1])).toEqual({ min: 1, max: 9 })
  })

  it('renvoie null sur une série vide', () => {
    expect(bornes([])).toBeNull()
  })
})

describe('versPolyline', () => {
  it('étale les points sur la largeur et inverse l’axe vertical', () => {
    // 0 → bas du cadre (y = 40), 10 → haut (y = 0), 5 → milieu (y = 20).
    expect(versPolyline([0, 5, 10], cadre)).toBe('0,40 50,20 100,0')
  })

  it('trace une ligne à mi-hauteur quand toutes les valeurs sont égales', () => {
    // max - min vaut zéro : c'est ici qu'une normalisation naïve divise par zéro.
    expect(versPolyline([500, 500, 500], cadre)).toBe('0,20 50,20 100,20')
  })

  it('ne trace rien avec un seul point', () => {
    expect(versPolyline([500], cadre)).toBe('')
  })

  it('ne trace rien sur une série vide', () => {
    expect(versPolyline([], cadre)).toBe('')
  })

  it('respecte la marge aux deux extrémités', () => {
    const points = versPolyline([0, 10], { largeur: 100, hauteur: 40, marge: 5 })
    expect(points).toBe('5,35 95,5')
  })
})

describe('versAire', () => {
  it('referme la courbe sur le bas du cadre', () => {
    expect(versAire([0, 10], cadre)).toBe('0,40 0,40 100,0 100,40')
  })

  it('ne referme rien quand il n’y a pas de courbe', () => {
    expect(versAire([500], cadre)).toBe('')
  })
})
