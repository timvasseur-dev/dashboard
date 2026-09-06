import { describe, it, expect } from 'vitest'
import { calculerImport } from './dedoublonnage.js'

const T = (montant, libelle = 'ACHAT', date = '2025-03-01') => ({
  accountId: 'compte-1',
  date,
  libelle,
  montant,
  devise: 'EUR',
})

describe('calculerImport', () => {
  it('insère tout quand l’historique est vide', () => {
    const { aInserer, doublons } = calculerImport([], [T(-10), T(-20)])
    expect(aInserer).toHaveLength(2)
    expect(doublons).toHaveLength(0)
  })

  it('ignore une ligne déjà présente à l’identique (ré-import)', () => {
    const { aInserer: premierLot } = calculerImport([], [T(-10)])
    const { aInserer, doublons } = calculerImport(premierLot, [T(-10)])
    expect(aInserer).toHaveLength(0)
    expect(doublons).toHaveLength(1)
  })

  it('traite deux lignes identiques comme un multiset, pas comme un doublon', () => {
    // Deux achats identiques (même jour, même montant, même libellé) dans un
    // seul fichier : les deux sont de vraies opérations distinctes.
    const { aInserer } = calculerImport([], [T(-5), T(-5)])
    expect(aInserer).toHaveLength(2)
    expect(aInserer[0].id).not.toBe(aInserer[1].id)
  })

  it('sur un ré-import partiel, ne réinsère que les occurrences réellement nouvelles', () => {
    // Historique : une seule occurrence déjà présente.
    const { aInserer: premierLot } = calculerImport([], [T(-5)])
    // Nouveau fichier : deux occurrences (la banque a ajouté une opération
    // identique le même jour). Une seule doit être considérée comme nouvelle.
    const { aInserer, doublons } = calculerImport(premierLot, [T(-5), T(-5)])
    expect(aInserer).toHaveLength(1)
    expect(doublons).toHaveLength(1)
  })

  it('distingue deux transactions par compte, date ou libellé différents', () => {
    const { aInserer } = calculerImport(
      [],
      [T(-5, 'ACHAT A'), T(-5, 'ACHAT B'), T(-5, 'ACHAT A', '2025-03-02')],
    )
    expect(aInserer).toHaveLength(3)
  })
})
