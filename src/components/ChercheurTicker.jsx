import { useState } from 'react'
import { rechercherInstrument } from '../data/coursApi.js'
import './ChercheurTicker.css'

/** Recherche Yahoo par nom ou ISIN : le ticker seul n'identifie pas un
 * instrument (cf. CLAUDE.md § « Le ticker ne suffit pas »). `onChoisir`
 * reçoit { ticker, nom, place, devise } pour préremplir le formulaire
 * appelant.
 *
 * Pas de <form> ici : ce composant est toujours monté à l'intérieur du
 * <form> du formulaire parent (position ou suivi), et un <form> imbriqué
 * dans un <form> est invalide — le clic sur le bouton ne déclenchait
 * plus rien de fiable. Le bouton et la touche Entrée appellent chercher()
 * directement. */
export default function ChercheurTicker({ onChoisir }) {
  const [q, setQ] = useState('')
  const [resultats, setResultats] = useState(null)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState('')

  const chercher = async () => {
    const terme = q.trim()
    if (!terme) return
    setEnCours(true)
    setErreur('')
    setResultats(null)
    try {
      setResultats(await rechercherInstrument(terme))
    } catch {
      setErreur('Recherche indisponible — réessayez.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="chercheur">
      <div className="chercheur__barre">
        <input
          className="chercheur__champ"
          placeholder="Chercher par nom ou ISIN"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setResultats(null)
            setErreur('')
          }}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            e.preventDefault() // sinon Entrée soumet aussi le formulaire parent
            chercher()
          }}
        />
        <button className="chercheur__bouton" type="button" disabled={enCours} onClick={chercher}>
          {enCours ? 'Recherche…' : 'Rechercher'}
        </button>
      </div>

      {enCours && <p className="chercheur__statut">Recherche en cours…</p>}
      {!enCours && erreur && <p className="chercheur__erreur">{erreur}</p>}
      {!enCours && !erreur && resultats && resultats.length === 0 && (
        <p className="chercheur__statut">Aucun résultat pour « {q} ».</p>
      )}

      {resultats && resultats.length > 0 && (
        <ul className="chercheur__resultats">
          {resultats.map((r) => (
            <li key={r.ticker}>
              <button
                type="button"
                className="chercheur__resultat"
                onClick={() => {
                  onChoisir(r)
                  setResultats(null)
                  setQ('')
                  setErreur('')
                }}
              >
                <span className="chercheur__resultat-ticker">{r.ticker}</span>
                <span className="chercheur__resultat-nom">{r.nom}</span>
                <span className="chercheur__resultat-detail">
                  {r.place}
                  {r.devise ? ` · ${r.devise}` : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
