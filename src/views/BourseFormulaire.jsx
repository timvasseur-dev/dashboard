import { useState } from 'react'
import Field from '../components/Field.jsx'
import {
  ajouterPosition,
  modifierPosition,
  supprimerPosition,
  ajouterSuivi,
  modifierSuivi,
  supprimerSuivi,
  promouvoirEnPosition,
  majCours,
  supprimerCours,
} from '../data/store.js'
import { DEVISES } from '../data/schema.js'

/** Sélectionne le formulaire selon le mode de la feuille ouverte dans Bourse. */
export default function FormulaireBourse({ sheet, comptes, quotes, onFermer }) {
  switch (sheet.mode) {
    case 'nouvelle-position':
      return <FormulairePosition comptes={comptes} quotes={quotes} onFermer={onFermer} />
    case 'position':
      return <FormulairePosition comptes={comptes} quotes={quotes} position={sheet.position} onFermer={onFermer} />
    case 'nouveau-suivi':
      return <FormulaireSuivi onFermer={onFermer} />
    case 'suivi':
      return <FormulaireSuivi suivi={sheet.suivi} onFermer={onFermer} />
    case 'promotion':
      return <FormulairePromotion suivi={sheet.suivi} comptes={comptes} onFermer={onFermer} />
    default:
      return null
  }
}

function FormulairePosition({ comptes, quotes, position, onFermer }) {
  const [accountId, setAccountId] = useState(position?.accountId ?? comptes[0]?.id ?? '')
  const [ticker, setTicker] = useState(position?.ticker ?? '')
  const [isin, setIsin] = useState(position?.isin ?? '')
  const [quantite, setQuantite] = useState(position?.quantite ?? '')
  const [pru, setPru] = useState(position?.pru ?? '')
  const [devise, setDevise] = useState(position?.devise ?? DEVISES[0])
  const coursInitial = position ? (quotes[position.ticker]?.prix ?? '') : ''
  const [cours, setCours] = useState(coursInitial)
  const [confirmation, setConfirmation] = useState(false)

  const valider = (e) => {
    e.preventDefault()
    const tickerNormalise = ticker.trim().toUpperCase()
    const donnees = {
      accountId,
      ticker: tickerNormalise,
      isin: isin.trim(),
      quantite: Number(quantite),
      pru: Number(pru),
      devise,
    }
    if (position) {
      modifierPosition(position.id, donnees)
    } else {
      ajouterPosition(donnees)
    }
    if (cours !== '') {
      majCours(tickerNormalise, Number(String(cours).replace(',', '.')), devise)
    } else if (coursInitial !== '') {
      supprimerCours(position.ticker)
    }
    onFermer()
  }

  return (
    <form className="bourse__formulaire" onSubmit={valider}>
      <label className="comptes__champ-select">
        <span className="field__label">Compte</span>
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          {comptes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.libelle}
            </option>
          ))}
        </select>
      </label>
      <Field label="Ticker" value={ticker} onChange={(e) => setTicker(e.target.value)} required />
      <Field label="ISIN" value={isin} onChange={(e) => setIsin(e.target.value)} />
      <Field label="Quantité" numerique value={quantite} onChange={(e) => setQuantite(e.target.value)} required />
      <Field
        label="Prix de revient unitaire"
        numerique
        value={pru}
        onChange={(e) => setPru(e.target.value)}
        required
      />
      <label className="comptes__champ-select">
        <span className="field__label">Devise</span>
        <select value={devise} onChange={(e) => setDevise(e.target.value)}>
          {DEVISES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
      <Field label="Cours actuel" numerique value={cours} onChange={(e) => setCours(e.target.value)} />

      <button className="comptes__valider" type="submit">
        Enregistrer
      </button>

      {position &&
        (confirmation ? (
          <button
            type="button"
            className="comptes__supprimer comptes__supprimer--confirme"
            onClick={() => {
              supprimerPosition(position.id)
              onFermer()
            }}
          >
            Confirmer la suppression
          </button>
        ) : (
          <button type="button" className="comptes__supprimer" onClick={() => setConfirmation(true)}>
            Supprimer la position
          </button>
        ))}
    </form>
  )
}

function FormulaireSuivi({ suivi, onFermer }) {
  const [ticker, setTicker] = useState(suivi?.ticker ?? '')
  const [libelle, setLibelle] = useState(suivi?.libelle ?? '')
  const [devise, setDevise] = useState(suivi?.devise ?? DEVISES[0])
  const [note, setNote] = useState(suivi?.note ?? '')
  const [confirmation, setConfirmation] = useState(false)

  const valider = (e) => {
    e.preventDefault()
    const donnees = { ticker: ticker.trim().toUpperCase(), libelle: libelle.trim(), devise, note: note.trim() }
    if (suivi) {
      modifierSuivi(suivi.id, donnees)
    } else {
      ajouterSuivi(donnees)
    }
    onFermer()
  }

  return (
    <form className="bourse__formulaire" onSubmit={valider}>
      <Field label="Ticker" value={ticker} onChange={(e) => setTicker(e.target.value)} required />
      <Field label="Libellé" value={libelle} onChange={(e) => setLibelle(e.target.value)} />
      <label className="comptes__champ-select">
        <span className="field__label">Devise</span>
        <select value={devise} onChange={(e) => setDevise(e.target.value)}>
          {DEVISES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
      <Field label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
      <button className="comptes__valider" type="submit">
        Enregistrer
      </button>

      {suivi &&
        (confirmation ? (
          <button
            type="button"
            className="comptes__supprimer comptes__supprimer--confirme"
            onClick={() => {
              supprimerSuivi(suivi.id)
              onFermer()
            }}
          >
            Confirmer la suppression
          </button>
        ) : (
          <button type="button" className="comptes__supprimer" onClick={() => setConfirmation(true)}>
            Supprimer le suivi
          </button>
        ))}
    </form>
  )
}

function FormulairePromotion({ suivi, comptes, onFermer }) {
  const [accountId, setAccountId] = useState(comptes[0]?.id ?? '')
  const [quantite, setQuantite] = useState('')
  const [pru, setPru] = useState('')

  const valider = (e) => {
    e.preventDefault()
    promouvoirEnPosition(suivi.id, { accountId, quantite: Number(quantite), pru: Number(pru) })
    onFermer()
  }

  return (
    <form className="bourse__formulaire" onSubmit={valider}>
      <p className="bourse__promotion-info">
        {suivi.ticker} — {suivi.libelle}
      </p>
      <label className="comptes__champ-select">
        <span className="field__label">Compte</span>
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          {comptes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.libelle}
            </option>
          ))}
        </select>
      </label>
      <Field label="Quantité" numerique value={quantite} onChange={(e) => setQuantite(e.target.value)} required />
      <Field
        label="Prix de revient unitaire"
        numerique
        value={pru}
        onChange={(e) => setPru(e.target.value)}
        required
      />
      <button className="comptes__valider" type="submit">
        Enregistrer
      </button>
    </form>
  )
}
