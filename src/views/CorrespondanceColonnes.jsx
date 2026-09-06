import { useMemo, useState } from 'react'
import { detecterDelimiteur, parseLigneCsv } from '../lib/csv.js'
import Field from '../components/Field.jsx'
import './CorrespondanceColonnes.css'

const AUCUNE = ''

/**
 * Réglage d'un nouveau profil de correspondance : on clique la ligne d'en-tête
 * réelle du fichier (pour sauter un éventuel préambule), puis on associe
 * chaque colonne détectée à son rôle. Le délimiteur est redétecté ici, jamais
 * stocké dans le profil (cf. CLAUDE.md § phase 5).
 */
export default function CorrespondanceColonnes({ lignesBrutes, onEnregistrer, onAnnuler }) {
  const [ligneEntete, setLigneEntete] = useState(0)
  const [nom, setNom] = useState('')
  const [formatDate, setFormatDate] = useState('JJ/MM/AAAA')
  const [montantUnique, setMontantUnique] = useState(true)
  const [colDate, setColDate] = useState(AUCUNE)
  const [colLibelle, setColLibelle] = useState(AUCUNE)
  const [colMontant, setColMontant] = useState(AUCUNE)
  const [colDebit, setColDebit] = useState(AUCUNE)
  const [colCredit, setColCredit] = useState(AUCUNE)

  const entetes = useMemo(() => {
    const ligne = lignesBrutes[ligneEntete]
    if (!ligne) return []
    return parseLigneCsv(ligne, detecterDelimiteur(ligne))
  }, [lignesBrutes, ligneEntete])

  const pret =
    nom.trim() !== '' &&
    colDate !== AUCUNE &&
    colLibelle !== AUCUNE &&
    (montantUnique ? colMontant !== AUCUNE : colDebit !== AUCUNE && colCredit !== AUCUNE)

  const valider = (e) => {
    e.preventDefault()
    if (!pret) return
    onEnregistrer({
      nom: nom.trim(),
      ignorerLignesAvant: ligneEntete,
      formatDate,
      colonnes: montantUnique
        ? { date: colDate, libelle: colLibelle, montant: colMontant }
        : { date: colDate, libelle: colLibelle, debit: colDebit, credit: colCredit },
    })
  }

  return (
    <form className="correspondance" onSubmit={valider}>
      <p className="correspondance__aide">
        Touche la ligne d'en-tête réelle du fichier (les lignes au-dessus sont ignorées) :
      </p>
      <ol className="correspondance__lignes" start={1}>
        {lignesBrutes.slice(0, 15).map((ligne, i) => (
          <li key={i}>
            <button
              type="button"
              className={'correspondance__ligne' + (i === ligneEntete ? ' correspondance__ligne--active' : '')}
              onClick={() => setLigneEntete(i)}
            >
              {ligne}
            </button>
          </li>
        ))}
      </ol>

      <Field label="Nom du profil" value={nom} onChange={(e) => setNom(e.target.value)} required />

      <div className="correspondance__champ-select">
        <span className="field__label">Colonne date</span>
        <ChoixColonne entetes={entetes} value={colDate} onChange={setColDate} />
      </div>

      <fieldset className="correspondance__format-date">
        <legend className="field__label">Format de la date</legend>
        <label>
          <input
            type="radio"
            checked={formatDate === 'JJ/MM/AAAA'}
            onChange={() => setFormatDate('JJ/MM/AAAA')}
          />
          JJ/MM/AAAA
        </label>
        <label>
          <input
            type="radio"
            checked={formatDate === 'AAAA-MM-JJ'}
            onChange={() => setFormatDate('AAAA-MM-JJ')}
          />
          AAAA-MM-JJ
        </label>
      </fieldset>

      <div className="correspondance__champ-select">
        <span className="field__label">Colonne libellé</span>
        <ChoixColonne entetes={entetes} value={colLibelle} onChange={setColLibelle} />
      </div>

      <fieldset className="correspondance__format-date">
        <legend className="field__label">Montant</legend>
        <label>
          <input type="radio" checked={montantUnique} onChange={() => setMontantUnique(true)} />
          Une seule colonne signée
        </label>
        <label>
          <input type="radio" checked={!montantUnique} onChange={() => setMontantUnique(false)} />
          Débit et crédit séparés
        </label>
      </fieldset>

      {montantUnique ? (
        <div className="correspondance__champ-select">
          <span className="field__label">Colonne montant</span>
          <ChoixColonne entetes={entetes} value={colMontant} onChange={setColMontant} />
        </div>
      ) : (
        <>
          <div className="correspondance__champ-select">
            <span className="field__label">Colonne débit</span>
            <ChoixColonne entetes={entetes} value={colDebit} onChange={setColDebit} />
          </div>
          <div className="correspondance__champ-select">
            <span className="field__label">Colonne crédit</span>
            <ChoixColonne entetes={entetes} value={colCredit} onChange={setColCredit} />
          </div>
        </>
      )}

      <button className="correspondance__valider" type="submit" disabled={!pret}>
        Enregistrer le profil
      </button>
      <button className="correspondance__annuler" type="button" onClick={onAnnuler}>
        Annuler
      </button>
    </form>
  )
}

/** Choix d'une colonne par bouton tapable, jamais par `<select>` : un menu
 * déroulant natif s'est révélé peu fiable à refermer une fois une option
 * choisie sur certains navigateurs/PWA installées (cf. CLAUDE.md § phase 5,
 * bug remonté à l'usage). Chaque bouton met à jour l'état parent directement
 * au tap, sans étape de fermeture séparée. */
function ChoixColonne({ entetes, value, onChange }) {
  return (
    <div className="correspondance__choix">
      {entetes.map((entete, i) => (
        <button
          key={i}
          type="button"
          className={'correspondance__choix-item' + (value === entete ? ' correspondance__choix-item--actif' : '')}
          onClick={() => onChange(entete)}
        >
          {entete || `(colonne ${i + 1} sans nom)`}
        </button>
      ))}
    </div>
  )
}
