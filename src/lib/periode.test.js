import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { debutPeriode, PERIODES, PERIODES_PATRIMOINE, PERIODES_TITRE } from './periode.js'

const jour = (date) => [date.getFullYear(), date.getMonth() + 1, date.getDate()]

describe('debutPeriode — périodes longues', () => {
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

describe('debutPeriode — périodes intraday', () => {
  it('recule d’un nombre de jours exact', () => {
    // 15 juin moins trois jours : 12 juin.
    expect(jour(debutPeriode('3j', new Date(2026, 5, 15, 14, 0)))).toEqual([2026, 6, 12])
  })

  it('franchit le changement de mois', () => {
    // 3 juin moins sept jours : 27 mai.
    expect(jour(debutPeriode('1sem', new Date(2026, 5, 3, 14, 0)))).toEqual([2026, 5, 27])
  })

  // Contrairement aux périodes longues : une fenêtre intraday glisse, c'est
  // tout son objet, et la ramener à minuit l'allongerait d'un bout de journée.
  it('garde l’heure au lieu de la ramener à minuit', () => {
    const debut = debutPeriode('1j', new Date(2026, 5, 15, 14, 30))
    expect([debut.getHours(), debut.getMinutes()]).toEqual([14, 30])
  })
})

describe('listes de périodes', () => {
  // Un instantané de patrimoine par jour au plus : une période d'un jour n'y
  // contiendrait qu'un point, et trois jours en contiendraient trois.
  it('écarte les périodes intraday de la courbe du patrimoine', () => {
    expect(PERIODES_PATRIMOINE.map((p) => p.cle)).toEqual(['1m', '3m', '1a', 'tout'])
  })

  it('offre toutes les périodes sur la fiche d’un titre', () => {
    expect(PERIODES_TITRE.map((p) => p.cle)).toEqual(['1j', '3j', '1sem', '1m', '3m', '1a', 'tout'])
  })

  it('donne une fraîcheur de cache d’autant plus courte que la période l’est', () => {
    const fraicheurs = PERIODES.map((p) => p.fraicheurMs)
    expect(fraicheurs).toEqual([...fraicheurs].sort((a, b) => a - b))
  })
})

/*
 * Le front et le worker tiennent chacun leur table de périodes — le premier
 * pour les libellés, le second pour les paramètres Yahoo. Tout le montage
 * repose sur le fait qu'elles portent les mêmes clés : une divergence produit
 * un bouton qui appelle une période que le worker refuse, sans que rien ne le
 * signale au montage.
 */
describe('accord avec l’allowlist du worker', () => {
  it('porte exactement les mêmes clés des deux côtés', () => {
    const source = readFileSync(new URL('../../worker/src/historiqueCours.js', import.meta.url), 'utf8')
    const table = source.match(/const PERIODES = \{([\s\S]*?)\n\}/)
    expect(table, 'table PERIODES introuvable dans le worker').not.toBeNull()

    const clesWorker = [...table[1].matchAll(/^\s*'?([\w]+)'?:\s*\{/gm)].map((m) => m[1])
    expect(clesWorker.sort()).toEqual(PERIODES.map((p) => p.cle).sort())
  })
})
