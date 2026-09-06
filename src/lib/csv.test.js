import { describe, it, expect } from 'vitest'
import { detecterDelimiteur, parseLigneCsv, decouperLignes } from './csv.js'

describe('detecterDelimiteur', () => {
  it('choisit la virgule quand elle est majoritaire', () => {
    expect(detecterDelimiteur('compte,date,montant')).toBe(',')
  })

  it('choisit le point-virgule quand il est majoritaire', () => {
    expect(detecterDelimiteur('Date;Libelle;Debit;Credit')).toBe(';')
  })
})

describe('parseLigneCsv', () => {
  it('découpe une ligne simple', () => {
    expect(parseLigneCsv('12345,01/03/2025,-100', ',')).toEqual(['12345', '01/03/2025', '-100'])
  })

  it('gère un champ guillemeté contenant le délimiteur', () => {
    expect(parseLigneCsv('01/03/2025;"ACHAT, VILLE";-12,50', ';')).toEqual([
      '01/03/2025',
      'ACHAT, VILLE',
      '-12,50',
    ])
  })

  it('gère un guillemet échappé à l\'intérieur d\'un champ', () => {
    expect(parseLigneCsv('"Boutique ""Le Test"""', ',')).toEqual(['Boutique "Le Test"'])
  })

  it('conserve les champs vides', () => {
    expect(parseLigneCsv('a,,c', ',')).toEqual(['a', '', 'c'])
  })
})

describe('decouperLignes', () => {
  it('retire les lignes vides et gère les deux styles de fin de ligne', () => {
    expect(decouperLignes('a\r\nb\n\nc')).toEqual(['a', 'b', 'c'])
  })
})
