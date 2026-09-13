import './Screen.css'

/**
 * Gabarit commun à toutes les vues : en-tête collant + zone de contenu centrée.
 * Ne connaît aucune donnée, tout arrive par les props. `action` reçoit un
 * bouton aligné à droite du titre, pour les gestes qui valent sur tout l'écran.
 */
export default function Screen({ title, subtitle, action, children }) {
  return (
    <main className="screen">
      <header className="screen__header">
        <div className="screen__titres">
          <h1 className="screen__title">{title}</h1>
          {subtitle && <p className="screen__subtitle">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className="screen__body">{children}</div>
    </main>
  )
}
