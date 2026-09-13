import { useMasquage, basculerMasquage } from '../data/masquage.js'
import './BoutonOeil.css'

/* Même facture que les icônes d'onglets : tracé seul, couleur héritée. */
function IconOeil({ barre }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
      {barre && <path d="M4 20 20 4" />}
    </svg>
  )
}

/** Masque ou révèle tous les montants de l'application, d'un seul geste. Le
 * choix survit à la fermeture de l'application : on ne rallume pas ses
 * chiffres sans le vouloir. */
export default function BoutonOeil() {
  const masque = useMasquage()
  const libelle = masque ? 'Afficher les montants' : 'Masquer les montants'

  return (
    <button className="oeil" onClick={basculerMasquage} aria-pressed={masque} aria-label={libelle} title={libelle}>
      <IconOeil barre={masque} />
    </button>
  )
}
