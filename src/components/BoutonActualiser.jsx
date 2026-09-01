import { useStatutRafraichissement } from '../data/statutRafraichissement.js'
import './BoutonActualiser.css'

/** Déclenche un rafraîchissement explicite. `onActualiser` fait l'appel
 * réseau ; ce composant se contente d'afficher l'état et l'erreur — un échec
 * ne vide rien, les dernières valeurs connues restent affichées ailleurs. */
export default function BoutonActualiser({ onActualiser }) {
  const { enCours, derniereErreur } = useStatutRafraichissement()
  return (
    <div className="actualiser">
      <button className="actualiser__bouton" onClick={onActualiser} disabled={enCours}>
        {enCours ? 'Actualisation…' : 'Actualiser'}
      </button>
      {derniereErreur && (
        <span className="actualiser__erreur">Échec ({derniereErreur}) — dernières valeurs conservées</span>
      )}
    </div>
  )
}
