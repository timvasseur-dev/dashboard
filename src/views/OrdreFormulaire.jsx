import { useState } from 'react'
import Field from '../components/Field.jsx'
import Montant from '../components/Montant.jsx'
import ChercheurTicker from '../components/ChercheurTicker.jsx'
import { passerOrdre } from '../data/storeOrdres.js'
import { DEVISES } from '../data/schema.js'
import { erreurOrdre, apresOrdre, plusValueRealisee } from '../lib/ordres.js'
import { parseMontantFr } from '../lib/money.js'
import './OrdreFormulaire.css'

// Valeur du choix « Nouvelle ligne » dans la liste des lignes du compte.
const NOUVELLE_LIGNE = ''

/** Jour courant en `AAAA-MM-JJ`, heure locale : date par défaut de l'ordre,
 * et borne haute — un ordre exécuté est passé. */
function aujourdhui() {
  const maintenant = new Date()
  const mois = String(maintenant.getMonth() + 1).padStart(2, '0')
  const jour = String(maintenant.getDate()).padStart(2, '0')
  return `${maintenant.getFullYear()}-${mois}-${jour}`
}

/**
 * Saisie d'un ordre exécuté. L'ordre met la ligne à jour (cf. lib/ordres.js) :
 * un achat renforce ou ouvre une ligne, une vente l'allège ou la solde. Seul
 * un achat ouvre une ligne ; une vente se choisit parmi les lignes du compte.
 */
export default function FormulaireOrdre({ comptes, positions, quotes, onFermer }) {
  const premiereLigne = (idCompte) => positions.find((p) => p.accountId === idCompte)?.id ?? NOUVELLE_LIGNE
  const compteInitial = comptes[0]?.id ?? ''

  const [accountId, setAccountId] = useState(compteInitial)
  const [positionId, setPositionId] = useState(premiereLigne(compteInitial))
  const [sens, setSens] = useState('achat')
  const [date, setDate] = useState(aujourdhui())
  const [quantite, setQuantite] = useState('')
  const [cours, setCours] = useState('')
  const [frais, setFrais] = useState('')
  const [ticker, setTicker] = useState('')
  const [isin, setIsin] = useState('')
  const [devise, setDevise] = useState(comptes.find((c) => c.id === compteInitial)?.devise ?? DEVISES[0])
  const [erreur, setErreur] = useState('')
  const [enregistre, setEnregistre] = useState(null)

  const compte = comptes.find((c) => c.id === accountId)
  const lignes = positions.filter((p) => p.accountId === accountId)
  const ligne = lignes.find((p) => p.id === positionId) ?? null
  const deviseOrdre = ligne?.devise ?? devise

  const choisirCompte = (id) => {
    setAccountId(id)
    choisirLigne(premiereLigne(id))
    setDevise(comptes.find((c) => c.id === id)?.devise ?? DEVISES[0])
  }
  const choisirLigne = (id) => {
    setPositionId(id)
    // Seul un achat ouvre une ligne : rien à vendre sur une ligne neuve.
    if (id === NOUVELLE_LIGNE) setSens('achat')
  }

  const donnees = {
    sens,
    quantite: parseMontantFr(quantite) ?? Number.NaN,
    cours: parseMontantFr(cours) ?? Number.NaN,
    frais: parseMontantFr(frais) ?? 0,
  }
  const avant = ligne ?? { quantite: 0, pru: 0 }

  const valider = (e) => {
    e.preventDefault()
    setErreur('')
    if (date > aujourdhui()) {
      setErreur('Un ordre exécuté ne peut pas être daté dans le futur.')
      return
    }
    try {
      passerOrdre({
        accountId,
        positionId: ligne?.id,
        ticker: ticker.trim().toUpperCase(),
        isin: isin.trim(),
        devise,
        date,
        ...donnees,
      })
      setEnregistre({ sens, compte: compte?.libelle })
    } catch (err) {
      setErreur(err.message)
    }
  }

  if (enregistre) {
    return (
      <div className="bourse__formulaire">
        <p className="ordre__note">
          {enregistre.sens === 'achat' ? 'Achat enregistré' : 'Vente enregistrée'}. Le solde espèces de «{' '}
          {enregistre.compte} » n’est pas recalculé : pensez à le mettre à jour dans Comptes.
        </p>
        <button className="comptes__valider" type="button" onClick={onFermer}>
          Fermer
        </button>
      </div>
    )
  }

  return (
    <form className="bourse__formulaire" onSubmit={valider}>
      <label className="comptes__champ-select">
        <span className="field__label">Compte</span>
        <select value={accountId} onChange={(e) => choisirCompte(e.target.value)}>
          {comptes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.libelle}
            </option>
          ))}
        </select>
      </label>
      <label className="comptes__champ-select">
        <span className="field__label">Ligne</span>
        <select value={ligne?.id ?? NOUVELLE_LIGNE} onChange={(e) => choisirLigne(e.target.value)}>
          {lignes.map((p) => (
            <option key={p.id} value={p.id}>
              {quotes[p.ticker]?.nom ? `${p.ticker} · ${quotes[p.ticker].nom}` : p.ticker}
            </option>
          ))}
          <option value={NOUVELLE_LIGNE}>Nouvelle ligne…</option>
        </select>
      </label>

      {!ligne && (
        <>
          <ChercheurTicker
            onChoisir={(r) => {
              setTicker(r.ticker)
              if (r.devise) setDevise(r.devise)
            }}
          />
          <Field label="Ticker" value={ticker} onChange={(e) => setTicker(e.target.value)} required />
          <Field label="ISIN" value={isin} onChange={(e) => setIsin(e.target.value)} />
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
        </>
      )}

      <label className="comptes__champ-select">
        <span className="field__label">Sens</span>
        <select value={sens} onChange={(e) => setSens(e.target.value)}>
          <option value="achat">Achat</option>
          <option value="vente" disabled={!ligne}>
            Vente
          </option>
        </select>
      </label>
      <Field
        label="Date d’exécution"
        type="date"
        max={aujourdhui()}
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
      <Field label="Quantité" numerique value={quantite} onChange={(e) => setQuantite(e.target.value)} required />
      <Field
        label={`Cours unitaire (${deviseOrdre})`}
        numerique
        value={cours}
        onChange={(e) => setCours(e.target.value)}
        required
      />
      <Field
        label={`Frais (${deviseOrdre})`}
        numerique
        value={frais}
        onChange={(e) => setFrais(e.target.value)}
        placeholder="0"
      />

      <Apercu avant={avant} donnees={donnees} devise={deviseOrdre} />
      {erreur && <p className="ordre__erreur">{erreur}</p>}

      <button className="comptes__valider" type="submit">
        Enregistrer l’ordre
      </button>
    </form>
  )
}

/** Ce que l'ordre fera à la ligne, avant de l'enregistrer. Rien tant que la
 * saisie est incomplète ; la raison d'un refus dès qu'elle est lisible. */
function Apercu({ avant, donnees, devise }) {
  const saisieComplete = Number.isFinite(donnees.quantite) && Number.isFinite(donnees.cours)
  if (!saisieComplete) {
    return avant.quantite > 0 ? (
      <p className="ordre__note">
        Détenu : <Montant valeur={avant.quantite} brut /> × <Montant valeur={avant.pru} devise={devise} />
      </p>
    ) : null
  }

  const refus = erreurOrdre(avant, donnees)
  if (refus) return <p className="ordre__erreur">{refus}</p>

  const ordre = { ...donnees, quantiteAvant: avant.quantite, pruAvant: avant.pru }
  const apres = apresOrdre(ordre)
  const plusValue = plusValueRealisee(ordre)

  return (
    <dl className="ordre__apercu">
      {plusValue !== null && (
        <div className="ordre__ligne">
          <dt>Plus-value réalisée</dt>
          <dd>
            <Montant
              valeur={plusValue}
              devise={devise}
              signe
              className={plusValue >= 0 ? 'ordre__pv--pos' : 'ordre__pv--neg'}
            />
          </dd>
        </div>
      )}
      <div className="ordre__ligne">
        <dt>Après l’ordre</dt>
        <dd>
          {apres.quantite === 0 ? (
            'ligne soldée'
          ) : (
            <>
              <Montant valeur={apres.quantite} brut /> × <Montant valeur={apres.pru} devise={devise} />
            </>
          )}
        </dd>
      </div>
    </dl>
  )
}
