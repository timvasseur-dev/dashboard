import { useMasquage } from '../data/masquage.js'
import { formatEur, formatDevise } from '../lib/money.js'

// Trois points, assez larges pour ne pas laisser deviner la longueur du
// nombre qu'ils remplacent.
const MASQUE = '•••'

/**
 * Un montant affiché — et le seul endroit qui décide de le montrer ou non.
 *
 * Tout ce qui relève du patrimoine passe par ici : soldes, valorisations,
 * plus-values, quantités, prix de revient. Pas les données de marché (cours,
 * taux, niveaux d'indice) : elles ne disent rien de ce qu'on détient, et les
 * cacher n'apporterait rien à quelqu'un qui consulte l'application dans le
 * métro.
 *
 * Lit la préférence d'affichage, jamais l'état du patrimoine.
 */
export default function Montant({ valeur, devise, signe = false, brut = false, className = '' }) {
  const masque = useMasquage()
  const classes = `num ${className}`.trim()

  if (masque) return <span className={classes}>{MASQUE}</span>
  if (valeur === null || valeur === undefined) return <span className={classes}>—</span>

  const prefixe = signe && valeur >= 0 ? '+' : ''
  const texte = brut ? String(valeur) : devise ? formatDevise(valeur, devise) : formatEur(valeur)

  return <span className={classes}>{`${prefixe}${texte}`}</span>
}
