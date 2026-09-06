import { describe, it, expect } from 'vitest'
import { analyserFichier } from './importBancaire.js'

// Fixtures entièrement inventées : seule la forme des vrais exports
// (préambule, délimiteur, colonnes) est reprise, aucune valeur réelle.

describe('analyserFichier — montant signé en une colonne (forme BCI)', () => {
  const profil = {
    ignorerLignesAvant: 1,
    formatDate: 'JJ/MM/AAAA',
    colonnes: { date: 'date_operation', libelle: 'libelle', montant: 'montant' },
  }
  const lignes = [
    'Compte,00000000000,,Du,Pas de date',
    'compte,date_operation,montant,devise_compte,libelle',
    '00000000000,01/03/2025,-1500,XPF,ACHAT TEST',
    '00000000000,02/03/2025,2000,XPF,VIREMENT TEST',
  ]

  it('saute le préambule et lit un montant signé', () => {
    const { transactions, erreurs } = analyserFichier({
      lignes,
      profil,
      accountId: 'compte-1',
      devise: 'XPF',
    })
    expect(erreurs).toHaveLength(0)
    expect(transactions).toEqual([
      { accountId: 'compte-1', date: '2025-03-01', libelle: 'ACHAT TEST', montant: -1500, devise: 'XPF' },
      { accountId: 'compte-1', date: '2025-03-02', libelle: 'VIREMENT TEST', montant: 2000, devise: 'XPF' },
    ])
  })
})

describe('analyserFichier — débit/crédit séparés (forme Caisse d\'Épargne)', () => {
  const profil = {
    ignorerLignesAvant: 0,
    formatDate: 'JJ/MM/AAAA',
    colonnes: {
      date: 'Date de comptabilisation',
      libelle: 'Libelle simplifie',
      debit: 'Debit',
      credit: 'Credit',
    },
  }
  const lignes = [
    'Date de comptabilisation;Libelle simplifie;Debit;Credit',
    '01/03/2025;ACHAT TEST;-45,00;',
    '02/03/2025;VIREMENT RECU;;150,00',
  ]

  it('combine débit et crédit en un montant signé', () => {
    const { transactions } = analyserFichier({ lignes, profil, accountId: 'compte-2', devise: 'EUR' })
    expect(transactions).toEqual([
      { accountId: 'compte-2', date: '2025-03-01', libelle: 'ACHAT TEST', montant: -45, devise: 'EUR' },
      { accountId: 'compte-2', date: '2025-03-02', libelle: 'VIREMENT RECU', montant: 150, devise: 'EUR' },
    ])
  })
})

describe('analyserFichier — erreurs', () => {
  it('lève une erreur si une colonne configurée est introuvable', () => {
    const profil = {
      ignorerLignesAvant: 0,
      formatDate: 'AAAA-MM-JJ',
      colonnes: { date: 'dateOp', libelle: 'label', montant: 'montantIntrouvable' },
    }
    const lignes = ['dateOp;label;amount', '2025-03-01;ACHAT;-10,00']
    expect(() => analyserFichier({ lignes, profil, accountId: 'c', devise: 'EUR' })).toThrow(/introuvable/)
  })

  it('signale une ligne illisible sans faire échouer les autres', () => {
    const profil = {
      ignorerLignesAvant: 0,
      formatDate: 'AAAA-MM-JJ',
      colonnes: { date: 'dateOp', libelle: 'label', montant: 'amount' },
    }
    const lignes = [
      'dateOp;label;amount',
      'pas-une-date;ACHAT CASSE;-10,00',
      '2025-03-02;ACHAT OK;-20,00',
    ]
    const { transactions, erreurs } = analyserFichier({ lignes, profil, accountId: 'c', devise: 'EUR' })
    expect(transactions).toHaveLength(1)
    expect(transactions[0].libelle).toBe('ACHAT OK')
    expect(erreurs).toHaveLength(1)
    expect(erreurs[0].ligne).toBe(2)
  })
})
