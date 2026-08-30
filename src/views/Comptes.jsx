import { useState } from 'react'
import Screen from '../components/Screen.jsx'
import Section from '../components/Section.jsx'
import Row from '../components/Row.jsx'
import Sheet from '../components/Sheet.jsx'
import Field from '../components/Field.jsx'
import { useEtat, ajouterCompte, renommerCompte, supprimerCompte, majSolde } from '../data/store.js'
import { TYPES_COMPTE, DEVISES } from '../data/schema.js'
import { formatDevise } from '../lib/money.js'
import './Comptes.css'

const LIBELLE_TYPE = { courant: 'Courant', epargne: 'Épargne', pea: 'PEA', cto: 'CTO' }

export default function Comptes() {
  const etat = useEtat()
  const [soldeEnEdition, setSoldeEnEdition] = useState(null)
  const [sheet, setSheet] = useState(null) // { mode: 'ajout' | 'edition', ... }

  const groupes = etat.institutions.map((institution) => ({
    institution,
    comptes: etat.accounts.filter((c) => c.institutionId === institution.id),
  }))

  return (
    <Screen title="Comptes" subtitle="BCI, Boursobank, Caisse d'Épargne, IBKR">
      {groupes.map(({ institution, comptes }) => (
        <Section key={institution.id} titre={institution.nom} couleur={institution.couleur}>
          {comptes.map((compte) =>
            soldeEnEdition === compte.id ? (
              <Row key={compte.id} libelle={compte.libelle} sousLibelle={LIBELLE_TYPE[compte.type]}>
                <input
                  className="comptes__saisie num"
                  inputMode="decimal"
                  autoFocus
                  defaultValue={etat.balances[compte.id]?.montant ?? ''}
                  onFocus={(e) => e.target.select()}
                  onBlur={(e) => {
                    majSolde(compte.id, Number(e.target.value.replace(',', '.')) || 0)
                    setSoldeEnEdition(null)
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                />
              </Row>
            ) : (
              <Row key={compte.id} libelle={compte.libelle} sousLibelle={LIBELLE_TYPE[compte.type]}>
                <button className="comptes__solde num" onClick={() => setSoldeEnEdition(compte.id)}>
                  {formatDevise(etat.balances[compte.id]?.montant ?? 0, compte.devise)}
                </button>
                <button
                  className="comptes__gerer"
                  aria-label="Gérer le compte"
                  onClick={() => setSheet({ mode: 'edition', compte })}
                >
                  ⋯
                </button>
              </Row>
            ),
          )}
          <button
            className="comptes__ajouter"
            onClick={() => setSheet({ mode: 'ajout', institutionId: institution.id })}
          >
            + Ajouter un compte
          </button>
        </Section>
      ))}

      <Sheet
        titre={sheet?.mode === 'edition' ? 'Modifier le compte' : 'Ajouter un compte'}
        ouvert={sheet !== null}
        onFermer={() => setSheet(null)}
      >
        {sheet && <FormulaireCompte sheet={sheet} onFermer={() => setSheet(null)} />}
      </Sheet>
    </Screen>
  )
}

function FormulaireCompte({ sheet, onFermer }) {
  const compte = sheet.mode === 'edition' ? sheet.compte : null
  const [libelle, setLibelle] = useState(compte?.libelle ?? '')
  const [type, setType] = useState(compte?.type ?? TYPES_COMPTE[0])
  const [devise, setDevise] = useState(compte?.devise ?? DEVISES[0])
  const [confirmation, setConfirmation] = useState(false)

  const valider = (e) => {
    e.preventDefault()
    if (!libelle.trim()) return
    if (compte) {
      renommerCompte(compte.id, libelle.trim())
    } else {
      ajouterCompte({ institutionId: sheet.institutionId, libelle: libelle.trim(), type, devise })
    }
    onFermer()
  }

  return (
    <form className="comptes__formulaire" onSubmit={valider}>
      <Field label="Libellé" value={libelle} onChange={(e) => setLibelle(e.target.value)} required />

      {!compte && (
        <>
          <label className="comptes__champ-select">
            <span className="field__label">Type</span>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES_COMPTE.map((t) => (
                <option key={t} value={t}>
                  {LIBELLE_TYPE[t]}
                </option>
              ))}
            </select>
          </label>
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

      <button className="comptes__valider" type="submit">
        Enregistrer
      </button>

      {compte &&
        (confirmation ? (
          <button
            type="button"
            className="comptes__supprimer comptes__supprimer--confirme"
            onClick={() => {
              supprimerCompte(compte.id)
              onFermer()
            }}
          >
            Confirmer la suppression
          </button>
        ) : (
          <button type="button" className="comptes__supprimer" onClick={() => setConfirmation(true)}>
            Supprimer le compte
          </button>
        ))}
    </form>
  )
}
