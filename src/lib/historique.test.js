import { describe, it, expect } from 'vitest'
import {
  serieHistorique,
  dernierInstantane,
  instantaneDuJour,
  pointsSurPeriode,
  variationSurPeriode,
} from './historique.js'

// Instantané minimal : seuls `date` et `totalEur` comptent ici.
const point = (date, totalEur) => ({ date: new Date(date).toISOString(), totalEur })

describe('serieHistorique', () => {
  it('trie par date, quel que soit l’ordre d’ajout', () => {
    const serie = serieHistorique([point('2026-03-10T09:00', 300), point('2026-01-05T09:00', 100)])
    expect(serie.map((p) => p.totalEur)).toEqual([100, 300])
  })

  it('ne garde qu’un point par jour : le plus tardif', () => {
    const serie = serieHistorique([
      point('2026-03-10T08:00', 100),
      point('2026-03-10T19:30', 180),
      point('2026-03-11T08:00', 200),
    ])
    expect(serie.map((p) => p.totalEur)).toEqual([180, 200])
  })

  it('ignore un instantané dont la date est illisible', () => {
    const serie = serieHistorique([{ date: 'pas une date', totalEur: 999 }, point('2026-03-10T09:00', 100)])
    expect(serie.map((p) => p.totalEur)).toEqual([100])
  })

  it('renvoie un tableau vide sur un historique vide', () => {
    expect(serieHistorique([])).toEqual([])
  })
})

describe('dernierInstantane', () => {
  // C'est tout l'objet du module : `historique.at(-1)` renverrait ici le
  // point de janvier, simplement parce qu'il a été saisi en dernier.
  it('prend le plus récent par date, pas le dernier ajouté', () => {
    const historique = [point('2026-03-10T09:00', 300), point('2026-01-05T09:00', 100)]
    expect(dernierInstantane(historique).totalEur).toBe(300)
  })

  it('renvoie null sur un historique vide', () => {
    expect(dernierInstantane([])).toBeNull()
  })
})

describe('instantaneDuJour', () => {
  it('reconnaît un instantané pris le jour même, à une autre heure', () => {
    const historique = [point('2026-03-10T06:15', 100)]
    expect(instantaneDuJour(historique, new Date(2026, 2, 10, 21, 0))).toBe(true)
  })

  it('ne confond pas la veille avec aujourd’hui', () => {
    const historique = [point('2026-03-09T23:50', 100)]
    expect(instantaneDuJour(historique, new Date(2026, 2, 10, 0, 10))).toBe(false)
  })
})

describe('pointsSurPeriode', () => {
  const serie = serieHistorique([point('2026-01-05T09:00', 100), point('2026-03-10T09:00', 300)])

  it('coupe les points antérieurs à la borne', () => {
    expect(pointsSurPeriode(serie, new Date(2026, 1, 1)).map((p) => p.totalEur)).toEqual([300])
  })

  it('rend toute la série sans borne', () => {
    expect(pointsSurPeriode(serie, null)).toHaveLength(2)
  })
})

describe('variationSurPeriode', () => {
  const serie = serieHistorique([
    point('2026-01-05T09:00', 1000),
    point('2026-02-10T09:00', 1100),
    point('2026-03-10T09:00', 1250),
  ])

  it('mesure depuis le dernier point antérieur à la borne', () => {
    const variation = variationSurPeriode(serie, new Date(2026, 1, 15))
    expect(variation.depart.totalEur).toBe(1100)
    expect(variation.arrivee.totalEur).toBe(1250)
    expect(variation.montant).toBe(150)
    expect(variation.pourcentage).toBeCloseTo(13.636, 2)
  })

  it('part du premier point quand la période est « tout »', () => {
    expect(variationSurPeriode(serie, null).montant).toBe(250)
  })

  it('compte une baisse négativement', () => {
    const baisse = serieHistorique([point('2026-01-05T09:00', 1000), point('2026-03-10T09:00', 900)])
    expect(variationSurPeriode(baisse, null).montant).toBe(-100)
  })

  // Le cas qui compte : sans point assez ancien, on ne sait pas, et « on ne
  // sait pas » ne doit jamais s'afficher comme « 0 % ».
  it('renvoie null quand la série ne remonte pas jusqu’à la borne', () => {
    expect(variationSurPeriode(serie, new Date(2025, 0, 1))).toBeNull()
  })

  it('renvoie null avec un seul point', () => {
    expect(variationSurPeriode(serieHistorique([point('2026-03-10T09:00', 100)]), null)).toBeNull()
  })

  it('renvoie null sur une série vide', () => {
    expect(variationSurPeriode([], null)).toBeNull()
  })

  it('ne divise pas par zéro quand le point de départ vaut zéro', () => {
    const depuisZero = serieHistorique([point('2026-01-05T09:00', 0), point('2026-03-10T09:00', 500)])
    const variation = variationSurPeriode(depuisZero, null)
    expect(variation.montant).toBe(500)
    expect(variation.pourcentage).toBeNull()
  })
})
