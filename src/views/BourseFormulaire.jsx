import { useState } from 'react'
import Field from '../components/Field.jsx'
import {
  ajouterPosition,
  modifierPosition,
  supprimerPosition,
  ajouterSuivi,
  modifierSuivi,
  supprimerSuivi,
  majCours,
  supprimerCours,
} from '../data/store.js'
import { DEVISES, CONVICTIONS, HORIZONS } from '../data/schema.js'

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
      // Promouvoir une idée ouvre le formulaire de position pré-rempli du
      // ticker : quantité, PRU et devise se saisissent là, pas sur l'idée.
      return (
        <FormulairePosition
          comptes={comptes}
          quotes={quotes}
          tickerInitial={sheet.suivi.ticker}
          suiviAPromouvoir={sheet.suivi.id}
          onFermer={onFermer}
        />
      )
    default:
      return null
  }
}

function FormulairePosition({ comptes, quotes, position, tickerInitial, suiviAPromouvoir, onFermer }) {
  const [accountId, setAccountId] = useState(position?.accountId ?? comptes[0]?.id ?? '')
  const [ticker, setTicker] = useState(position?.ticker ?? tickerInitial ?? '')
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
      if (suiviAPromouvoir) supprimerSuivi(suiviAPromouvoir)
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
  const [conviction, setConviction] = useState(suivi?.conviction ?? '')
  const [horizon, setHorizon] = useState(suivi?.horizon ?? '')
  const [zoneAchatMin, setZoneAchatMin] = useState(suivi?.zoneAchatMin ?? '')
  const [zoneAchatMax, setZoneAchatMax] = useState(suivi?.zoneAchatMax ?? '')
  const [alertePrix, setAlertePrix] = useState(suivi?.alertePrix ?? '')
  const [these, setThese] = useState(suivi?.these ?? '')
  const [risques, setRisques] = useState(suivi?.risques ?? '')
  const [favori, setFavori] = useState(suivi?.favori ?? false)
  const [confirmation, setConfirmation] = useState(false)

  const nombreOuNul = (valeur) => (valeur === '' ? null : Number(valeur))

  const valider = (e) => {
    e.preventDefault()
    const donnees = {
      ticker: ticker.trim().toUpperCase(),
      libelle: libelle.trim(),
      conviction,
      horizon,
      zoneAchatMin: nombreOuNul(zoneAchatMin),
      zoneAchatMax: nombreOuNul(zoneAchatMax),
      alertePrix: nombreOuNul(alertePrix),
      these: these.trim(),
      risques: risques.trim(),
      favori,
    }
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
        <span className="field__label">Conviction</span>
        <select value={conviction} onChange={(e) => setConviction(e.target.value)}>
          <option value="">—</option>
          {CONVICTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="comptes__champ-select">
        <span className="field__label">Horizon</span>
        <select value={horizon} onChange={(e) => setHorizon(e.target.value)}>
          <option value="">—</option>
          {HORIZONS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
      </label>
      <Field
        label="Zone d'achat min"
        numerique
        value={zoneAchatMin}
        onChange={(e) => setZoneAchatMin(e.target.value)}
      />
      <Field
        label="Zone d'achat max"
        numerique
        value={zoneAchatMax}
        onChange={(e) => setZoneAchatMax(e.target.value)}
      />
      <Field label="Alerte prix" numerique value={alertePrix} onChange={(e) => setAlertePrix(e.target.value)} />
      <Field label="Thèse" value={these} onChange={(e) => setThese(e.target.value)} />
      <Field label="Risques" value={risques} onChange={(e) => setRisques(e.target.value)} />
      <label className="bourse__champ-favori">
        <input type="checkbox" checked={favori} onChange={(e) => setFavori(e.target.checked)} />
        <span className="field__label">Favori</span>
      </label>
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
