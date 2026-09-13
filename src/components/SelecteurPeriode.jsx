import { PERIODES } from '../lib/periode.js'
import './SelecteurPeriode.css'

/** Choix de la période d'une courbe. Composant pur : la liste vient de
 * `lib/periode.js`, seule source des clés — les mêmes que celles acceptées
 * par la route /historique du worker. */
export default function SelecteurPeriode({ valeur, onChange }) {
  return (
    <div className="periodes" role="group" aria-label="Période">
      {PERIODES.map((periode) => (
        <button
          key={periode.cle}
          className="periodes__choix"
          aria-pressed={periode.cle === valeur}
          onClick={() => onChange(periode.cle)}
        >
          {periode.libelle}
        </button>
      ))}
    </div>
  )
}
