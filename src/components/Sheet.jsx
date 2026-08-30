import { useEffect } from 'react'
import './Sheet.css'

/**
 * Panneau qui glisse depuis le bas de l'écran, pour les formulaires courts.
 * Ne connaît aucune donnée : titre, contenu et fermeture arrivent par les props.
 */
export default function Sheet({ titre, ouvert, onFermer, children }) {
  useEffect(() => {
    if (!ouvert) return
    const surEchap = (e) => e.key === 'Escape' && onFermer()
    window.addEventListener('keydown', surEchap)
    return () => window.removeEventListener('keydown', surEchap)
  }, [ouvert, onFermer])

  if (!ouvert) return null

  return (
    <div className="sheet__fond" onClick={onFermer}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <header className="sheet__header">
          <h2 className="sheet__titre">{titre}</h2>
          <button className="sheet__fermer" onClick={onFermer} aria-label="Fermer">
            ✕
          </button>
        </header>
        <div className="sheet__corps">{children}</div>
      </div>
    </div>
  )
}
