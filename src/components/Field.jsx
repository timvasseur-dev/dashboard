import './Field.css'

/**
 * Label + champ. `numerique` bascule le clavier décimal (`inputMode="decimal"`),
 * requis pour toute saisie de montant sur mobile.
 */
export default function Field({ label, numerique, ...props }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <input className="field__input" inputMode={numerique ? 'decimal' : undefined} {...props} />
    </label>
  )
}
