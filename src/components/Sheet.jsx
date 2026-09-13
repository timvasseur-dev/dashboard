import { useEffect } from 'react'
import './Sheet.css'

/**
 * Panneau qui glisse depuis le bas de l'écran, pour les formulaires courts.
 * Ne connaît aucune donnée : titre, contenu et fermeture arrivent par les props.
 *
 * `verrouille` bloque la fermeture par ✕, par le fond ou par Échap : sert
 * pendant une confirmation de suppression en attente, pour qu'un clic
 * malheureux hors du bouton de confirmation ne l'abandonne pas en silence.
 */
export default function Sheet({ titre, ouvert, onFermer, verrouille = false, children }) {
  useEffect(() => {
    if (!ouvert) return
    const surEchap = (e) => e.key === 'Escape' && !verrouille && onFermer()
    window.addEventListener('keydown', surEchap)
    return () => window.removeEventListener('keydown', surEchap)
  }, [ouvert, onFermer, verrouille])

  if (!ouvert) return null

  const fermer = () => {
    if (!verrouille) onFermer()
  }

  return (
    <div className="sheet__fond" onClick={fermer}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <header className="sheet__header">
          <h2 className="sheet__titre">{titre}</h2>
          <button className="sheet__fermer" onClick={fermer} aria-label="Fermer" disabled={verrouille}>
            ✕
          </button>
        </header>
        <div className="sheet__corps">{children}</div>
      </div>
    </div>
  )
}
