import './Row.css'

/**
 * Ligne d'une section : libellé à gauche, contenu libre à droite (montant,
 * badge, bouton). `onClick` la rend tapable, avec retour visuel au press.
 */
export default function Row({ libelle, sousLibelle, onClick, children }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag className="row" onClick={onClick}>
      <span className="row__texte">
        <span className="row__libelle">{libelle}</span>
        {sousLibelle && <span className="row__sous-libelle">{sousLibelle}</span>}
      </span>
      <span className="row__contenu">{children}</span>
    </Tag>
  )
}
