import './SelecteurPeriode.css'

/** Choix de la période d'une courbe. Composant pur : la liste arrive en prop,
 * parce que toutes les périodes n'ont pas de sens sur toutes les courbes —
 * cf. PERIODES_PATRIMOINE et PERIODES_TITRE dans `lib/periode.js`, seule
 * source des clés, les mêmes que celles acceptées par le worker. */
export default function SelecteurPeriode({ periodes, valeur, onChange }) {
  return (
    <div className="periodes" role="group" aria-label="Période">
      {periodes.map((periode) => (
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
