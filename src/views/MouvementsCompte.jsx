import { useState } from 'react'
import { useEtat } from '../data/store.js'
import { useHashRoute, navigate } from '../lib/router.js'
import Screen from '../components/Screen.jsx'
import Section from '../components/Section.jsx'
import Row from '../components/Row.jsx'
import Montant from '../components/Montant.jsx'
import { formatDateAffichee } from '../lib/date.js'
import './MouvementsCompte.css'

function idCompteDepuisChemin(chemin) {
  return chemin.match(/^\/comptes\/([^/]+)\//)?.[1] ?? null
}

/** Mouvements d'un compte, triés date décroissante, avec recherche sur le
 * libellé. Accessible depuis Comptes (tap sur le libellé d'un compte). */
export default function MouvementsCompte() {
  const etat = useEtat()
  const chemin = useHashRoute()
  const accountId = idCompteDepuisChemin(chemin)
  const compte = etat.accounts.find((c) => c.id === accountId)
  const [recherche, setRecherche] = useState('')

  if (!compte) {
    return (
      <Screen title="Mouvements">
        <p className="mouvements__vide">Compte introuvable.</p>
      </Screen>
    )
  }

  const institution = etat.institutions.find((i) => i.id === compte.institutionId)
  const tousLesMouvements = etat.transactions.filter((t) => t.accountId === accountId)
  const filtre = recherche.trim().toLowerCase()
  const mouvements = tousLesMouvements
    .filter((t) => !filtre || t.libelle.toLowerCase().includes(filtre))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

  return (
    <Screen title={compte.libelle} subtitle={institution?.nom}>
      <div className="mouvements__barre">
        <input
          className="mouvements__recherche"
          type="search"
          placeholder="Rechercher un libellé"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
        <button className="mouvements__importer" onClick={() => navigate(`/comptes/${accountId}/import`)}>
          Importer un relevé
        </button>
      </div>

      <Section titre="Mouvements">
        {mouvements.length === 0 ? (
          <p className="mouvements__vide">
            {tousLesMouvements.length === 0
              ? 'Aucun mouvement importé pour ce compte.'
              : 'Aucun mouvement ne correspond à la recherche.'}
          </p>
        ) : (
          mouvements.map((t) => (
            <Row key={t.id} libelle={t.libelle} sousLibelle={formatDateAffichee(t.date)}>
              <Montant
                valeur={t.montant}
                devise={t.devise}
                className={
                  'mouvements__montant ' +
                  (t.montant < 0 ? 'mouvements__montant--negatif' : 'mouvements__montant--positif')
                }
              />
            </Row>
          ))
        )}
      </Section>
    </Screen>
  )
}
