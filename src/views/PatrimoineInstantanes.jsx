import { useState } from 'react'
import Section from '../components/Section.jsx'
import Row from '../components/Row.jsx'
import Sheet from '../components/Sheet.jsx'
import Field from '../components/Field.jsx'
import { enregistrerInstantane, enregistrerInstantanePasse } from '../data/store.js'
import { serieHistorique } from '../lib/historique.js'
import { formatEur } from '../lib/money.js'
import './PatrimoineInstantanes.css'

const LIBELLE_ORIGINE = {
  auto: 'automatique',
  manuel: 'enregistré',
  saisi: 'saisi à la main',
}

// Assez pour vérifier d'un coup d'œil que la collecte tourne, sans dérouler
// une année de points.
const DERNIERS_AFFICHES = 10

/** Jour courant en `AAAA-MM-JJ`, heure locale — borne haute de la saisie : un
 * instantané passé est passé. */
function aujourdhui() {
  const maintenant = new Date()
  const mois = String(maintenant.getMonth() + 1).padStart(2, '0')
  const jour = String(maintenant.getDate()).padStart(2, '0')
  return `${maintenant.getFullYear()}-${mois}-${jour}`
}

/**
 * Les instantanés : le geste d'en enregistrer un, la saisie d'un point passé
 * pour amorcer la courbe, et les derniers enregistrés.
 *
 * La courbe se construit à partir d'ici et de nulle part ailleurs : rien n'est
 * reconstruit à partir des cours passés, faute de savoir ce qui était détenu à
 * quelle date (cf. CLAUDE.md § 3 et le plan de la phase 6).
 */
export default function PatrimoineInstantanes({ totalEur, tauxUsd, historique }) {
  const [sheetOuverte, setSheetOuverte] = useState(false)
  const serie = serieHistorique(historique)
  const derniers = [...serie].reverse().slice(0, DERNIERS_AFFICHES)

  return (
    <Section titre="Instantanés">
      {derniers.map((instantane) => (
        <Row
          key={instantane.date}
          libelle={new Date(instantane.date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
          sousLibelle={LIBELLE_ORIGINE[instantane.origine] ?? LIBELLE_ORIGINE.manuel}
        >
          <span className="num">{formatEur(instantane.totalEur)}</span>
        </Row>
      ))}

      {serie.length === 0 && (
        <p className="instantanes__vide">
          Aucun instantané. Un point s’enregistre tout seul au premier lancement de la journée, dès que tous
          les cours sont connus.
        </p>
      )}

      {serie.length > DERNIERS_AFFICHES && (
        <p className="instantanes__compte">{serie.length} jours enregistrés en tout</p>
      )}

      <button className="instantanes__action" onClick={() => enregistrerInstantane({ totalEur, tauxUsd })}>
        Enregistrer un instantané
      </button>
      <button className="instantanes__action" onClick={() => setSheetOuverte(true)}>
        Saisir un instantané passé
      </button>

      <Sheet titre="Instantané passé" ouvert={sheetOuverte} onFermer={() => setSheetOuverte(false)}>
        {sheetOuverte && <FormulaireInstantanePasse onFermer={() => setSheetOuverte(false)} />}
      </Sheet>
    </Section>
  )
}

/** Amorçage de la courbe à partir d'un vieux relevé : une date, un total.
 * Aucun taux n'est demandé — celui d'aujourd'hui ne dit rien de celui qui
 * valait à cette date-là. */
function FormulaireInstantanePasse({ onFermer }) {
  const [dateIso, setDateIso] = useState('')
  const [total, setTotal] = useState('')

  const valider = (e) => {
    e.preventDefault()
    const montant = Number(String(total).replace(',', '.'))
    if (!dateIso || Number.isNaN(montant)) return
    enregistrerInstantanePasse({ dateIso, totalEur: montant })
    onFermer()
  }

  return (
    <form className="instantanes__formulaire" onSubmit={valider}>
      <p className="instantanes__note">
        Un total relevé à une date passée, en euros. Il rejoint la courbe tel quel, sans être recalculé :
        c’est une valeur de mémoire, pas une mesure.
      </p>
      <Field
        label="Date"
        type="date"
        max={aujourdhui()}
        value={dateIso}
        onChange={(e) => setDateIso(e.target.value)}
        required
      />
      <Field
        label="Total en euros"
        numerique
        value={total}
        onChange={(e) => setTotal(e.target.value)}
        required
      />
      <button className="comptes__valider" type="submit">
        Enregistrer
      </button>
    </form>
  )
}
