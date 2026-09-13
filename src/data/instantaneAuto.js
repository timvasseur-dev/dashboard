// Enregistrement automatique d'un instantané par jour, au démarrage de
// l'application. Motif : une courbe de patrimoine ne se reconstruit pas après
// coup (cf. CLAUDE.md § 3), donc elle ne vaut que ce que vaut la régularité de
// la collecte — et un bouton qu'on oublie ne collecte rien.
//
// L'instantané n'est pas écrit à tout prix : mieux vaut un trou dans la courbe
// qu'un point faux, qu'on ne pourra plus distinguer des vrais ensuite.
import { etatCourant, enregistrerInstantane } from './store.js'
import { statutSynchronisationCourant } from './statutSynchronisation.js'
import { consolider } from '../lib/portfolio.js'
import { instantaneDuJour } from '../lib/historique.js'

/**
 * Écrit l'instantané du jour si toutes les conditions sont réunies, et renvoie
 * ce qui s'est passé — `{ ecrit: true }`, ou `{ ecrit: false, raison }`.
 *
 * À n'appeler qu'après un rafraîchissement réussi : figer un total, c'est
 * figer les cours qui l'ont produit, et des cours périmés donnent un point
 * définitivement faux.
 */
export function enregistrerInstantaneAutomatique() {
  // Un conflit de synchro en attente signifie que l'utilisateur n'a pas
  // encore dit quelle version garder. Ajouter un instantané à la version
  // locale la modifierait pendant qu'il choisit, et le perdrait s'il garde
  // l'autre.
  if (statutSynchronisationCourant().conflit) return { ecrit: false, raison: 'conflit' }

  const etat = etatCourant()

  if (instantaneDuJour(etat.historique)) return { ecrit: false, raison: 'deja' }

  // Un patrimoine vide vaut zéro sans que ce zéro veuille dire quoi que ce
  // soit : ne rien enregistrer tant que rien n'est saisi.
  if (etat.accounts.length === 0 && etat.positions.length === 0) {
    return { ecrit: false, raison: 'vide' }
  }

  const { totalEur, tauxUtilise, coursManquants, montantsNonConvertis } = consolider({
    institutions: etat.institutions,
    accounts: etat.accounts,
    balances: etat.balances,
    positions: etat.positions,
    quotes: etat.quotes,
    fx: etat.fx,
  })

  // Les deux causes d'un total incomplet. Un instantané amputé d'une position
  // ou d'un solde en dollars passerait pour une baisse réelle du patrimoine.
  if (coursManquants.length > 0) return { ecrit: false, raison: 'cours' }
  if (montantsNonConvertis.length > 0) return { ecrit: false, raison: 'taux' }

  enregistrerInstantane({ totalEur, tauxUsd: tauxUtilise, origine: 'auto' })
  return { ecrit: true }
}
