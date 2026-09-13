// Historique de cours d'un instrument, pour les courbes de la modale par
// titre et de l'écran Marché.
//
// Le cache est en mémoire, et seulement là : jamais dans `vv.state`. Une série
// de 250 points par ticker dans un état chiffré puis synchronisé, c'est
// exactement ce qui a produit le dépassement de pile corrigé en 39df70c — et
// un historique se redemande en un appel, il n'a pas à survivre à la session.
import { useEffect, useState } from 'react'
import { recupererHistorique } from './coursApi.js'

const cache = new Map() // `${ticker}|${periode}` → { ticker, devise, points }

const cleDe = (ticker, periode) => `${ticker}|${periode}`

/**
 * État de chargement de l'historique demandé :
 * `{ statut: 'chargement' | 'pret' | 'erreur', donnees, erreur }`.
 *
 * Une erreur réseau — hors ligne, worker injoignable — est un état affichable,
 * pas une exception : la vue dit que l'historique est indisponible, elle ne
 * trace jamais une courbe plate à sa place.
 */
export function useHistoriqueCours(ticker, periode) {
  const [etat, setEtat] = useState(() => depuisCache(ticker, periode))

  useEffect(() => {
    const enCache = cache.get(cleDe(ticker, periode))
    if (enCache) {
      setEtat({ statut: 'pret', donnees: enCache, erreur: null })
      return undefined
    }

    // Le ticker ou la période peuvent changer avant la fin de l'appel : on
    // ignore alors la réponse, plutôt que d'afficher la courbe d'un autre
    // instrument pendant une fraction de seconde.
    let vivant = true
    setEtat({ statut: 'chargement', donnees: null, erreur: null })

    recupererHistorique(ticker, periode)
      .then((donnees) => {
        cache.set(cleDe(ticker, periode), donnees)
        if (vivant) setEtat({ statut: 'pret', donnees, erreur: null })
      })
      .catch((erreur) => {
        if (vivant) setEtat({ statut: 'erreur', donnees: null, erreur: erreur.message })
      })

    return () => {
      vivant = false
    }
  }, [ticker, periode])

  return etat
}

function depuisCache(ticker, periode) {
  const enCache = cache.get(cleDe(ticker, periode))
  return enCache
    ? { statut: 'pret', donnees: enCache, erreur: null }
    : { statut: 'chargement', donnees: null, erreur: null }
}
