import './Section.css'

/** Regroupe des lignes sous un titre, avec un accent de couleur optionnel. */
export default function Section({ titre, couleur, children }) {
  return (
    <section className="section">
      <header className="section__header">
        {couleur && <span className="section__pastille" style={{ background: couleur }} />}
        <h2 className="section__titre">{titre}</h2>
      </header>
      <div className="section__corps">{children}</div>
    </section>
  )
}
