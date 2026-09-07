import { describe, it, expect } from 'vitest'
import { deriverCle, chiffrer, dechiffrer } from './crypto.js'

/** Simule un état avec plusieurs milliers de transactions, pour reproduire
 * le dépassement de pile vu en synchro après l'import de 875 lignes
 * (`String.fromCharCode(...octets)` étalé sur un grand tableau d'octets). */
function etatVolumineux(nombreTransactions) {
  const transactions = Array.from({ length: nombreTransactions }, (_, i) => ({
    id: `t${i}`,
    accountId: 'compte-1',
    date: '2026-01-01',
    libelle: `Opération de test numéro ${i} avec un libellé assez long pour peser`,
    montant: -12.34,
    devise: 'EUR',
  }))
  return { transactions }
}

describe('chiffrer / dechiffrer sur un grand volume', () => {
  it('fait un aller-retour sans dépassement de pile avec 5000 transactions', async () => {
    const cle = await deriverCle('phrase-de-test')
    const clair = etatVolumineux(5000)

    const chiffre = await chiffrer(cle, clair)
    const dechiffre = await dechiffrer(cle, chiffre)

    expect(dechiffre).toEqual(clair)
  })

  it('fait un aller-retour avec un volume plus modeste (regression rapide)', async () => {
    const cle = await deriverCle('phrase-de-test')
    const clair = etatVolumineux(50)

    const chiffre = await chiffrer(cle, clair)
    const dechiffre = await dechiffrer(cle, chiffre)

    expect(dechiffre).toEqual(clair)
  })
})
