import { creerCompte, creerPosition, creerSuivi } from './schema.js'

const DATE_DEMO = '2026-08-01T08:00:00.000Z'

/**
 * Jeu de démonstration : valeurs manifestement fictives (soldes ronds, cours à
 * 100), construit à partir des institutions déjà présentes dans l'état
 * (structure fixe, cf. CLAUDE.md § 3). Aucun montant réel dans le dépôt.
 */
export function jeuDemo(institutions) {
  const idDe = (nom) => institutions.find((i) => i.nom === nom)?.id

  const bci = idDe('BCI')
  const boursobank = idDe('Boursobank')
  const cde = idDe("Caisse d'Épargne")
  const ibkr = idDe('IBKR')

  const comptes = [
    creerCompte({ institutionId: bci, libelle: 'Courant', type: 'courant', devise: 'XPF' }),
    creerCompte({ institutionId: bci, libelle: 'Épargne', type: 'epargne', devise: 'XPF' }),
    creerCompte({ institutionId: boursobank, libelle: 'Courant', type: 'courant', devise: 'EUR' }),
    creerCompte({ institutionId: boursobank, libelle: 'PEA', type: 'pea', devise: 'EUR' }),
    creerCompte({ institutionId: cde, libelle: 'Courant', type: 'courant', devise: 'EUR' }),
    creerCompte({ institutionId: cde, libelle: 'Livret A', type: 'epargne', devise: 'EUR' }),
    creerCompte({ institutionId: cde, libelle: 'LDD', type: 'epargne', devise: 'EUR' }),
    creerCompte({ institutionId: ibkr, libelle: 'CTO', type: 'cto', devise: 'USD' }),
  ]

  const [bciCourant, bciEpargne, bbCourant, bbPea, cdeCourant, cdeLivretA, cdeLdd, ibkrCto] = comptes

  const balances = Object.fromEntries(
    [
      [bciCourant, 111111],
      [bciEpargne, 222222],
      [bbCourant, 1111],
      [cdeCourant, 2222],
      [cdeLivretA, 3333],
      [cdeLdd, 1111],
      [ibkrCto, 1111],
    ].map(([compte, montant]) => [compte.id, { montant, date: DATE_DEMO }]),
  )

  const positions = [
    creerPosition({
      accountId: bbPea.id,
      ticker: 'CW8.PA',
      isin: 'FR0011869353',
      quantite: 10,
      pru: 90,
      devise: 'EUR',
    }),
    creerPosition({
      accountId: ibkrCto.id,
      ticker: 'IBIT',
      isin: 'US46090E1038',
      quantite: 5,
      pru: 40,
      devise: 'USD',
    }),
  ]

  const watchlist = [creerSuivi({ ticker: 'AAPL', libelle: 'Apple', devise: 'USD', note: '' })]

  const quotes = {
    'CW8.PA': { prix: 100, devise: 'EUR', horodatage: DATE_DEMO },
    IBIT: { prix: 50, devise: 'USD', horodatage: DATE_DEMO },
    AAPL: { prix: 100, devise: 'USD', horodatage: DATE_DEMO },
  }

  const fx = { 'USD/EUR': { taux: 0.9, horodatage: DATE_DEMO } }

  return { comptes, balances, positions, watchlist, quotes, fx }
}
