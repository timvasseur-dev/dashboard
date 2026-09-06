import { describe, it, expect } from 'vitest'
import { decoderTexte } from './encodageCsv.js'

describe('decoderTexte', () => {
  it('décode de l\'UTF-8 simple et l\'annonce comme tel', () => {
    const octets = new TextEncoder().encode('Libellé,Montant')
    expect(decoderTexte(octets)).toEqual({ texte: 'Libellé,Montant', encodage: 'UTF-8' })
  })

  it('retire le BOM UTF-8', () => {
    const bom = new Uint8Array([0xef, 0xbb, 0xbf])
    const corps = new TextEncoder().encode('dateOp;label')
    const octets = new Uint8Array([...bom, ...corps])
    expect(decoderTexte(octets)).toEqual({ texte: 'dateOp;label', encodage: 'UTF-8' })
  })

  it('se rabat sur Windows-1252 quand ce n\'est pas de l\'UTF-8 valide, et l\'annonce', () => {
    // 0xe9 seul est invalide en UTF-8, mais vaut 'é' en Windows-1252
    // (ex. « Débit » dans un en-tête latin1 réel, celui remonté par l'utilisateur).
    const octets = new Uint8Array([0x44, 0xe9, 0x62, 0x69, 0x74]) // "D\xe9bit"
    expect(decoderTexte(octets)).toEqual({ texte: 'Débit', encodage: 'Windows-1252' })
  })
})
