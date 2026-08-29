import './Screen.css'

/**
 * Gabarit commun à toutes les vues : en-tête collant + zone de contenu centrée.
 * Ne connaît aucune donnée, tout arrive par les props.
 */
export default function Screen({ title, subtitle, children }) {
  return (
    <main className="screen">
      <header className="screen__header">
        <h1 className="screen__title">{title}</h1>
        {subtitle && <p className="screen__subtitle">{subtitle}</p>}
      </header>
      <div className="screen__body">{children}</div>
    </main>
  )
}
