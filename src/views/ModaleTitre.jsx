import { useState } from 'react'
import Sheet from '../components/Sheet.jsx'
import Courbe from '../components/Courbe.jsx'
import SelecteurPeriode from '../components/SelecteurPeriode.jsx'
import Montant from '../components/Montant.jsx'
import Age from '../components/Age.jsx'
import { useEtat } from '../data/store.js'
import { useModaleTitre, fermerTitre } from '../data/modaleTitre.js'
import { useHistoriqueCours } from '../data/historiqueCours.js'
import { valoriserPosition } from '../lib/portfolio.js'
import { formatDevise } from '../lib/money.js'
import './ModaleTitre.css'

const formatteurPourcentage = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })

/**
 * Le détail d'un instrument : son cours, sa courbe, et ce qu'on en détient ou
 * ce qu'on en pense. Montée une seule fois dans App, ouverte depuis n'importe
 * quel écran (cf. src/data/modaleTitre.js).
 */
export default function ModaleTitre() {
  const cible = useModaleTitre()

  return (
    <Sheet titre={cible?.libelle ?? cible?.ticker ?? ''} ouvert={cible !== null} onFermer={fermerTitre}>
      {cible && <Contenu cible={cible} />}
    </Sheet>
  )
}

function Contenu({ cible }) {
  const etat = useEtat()
  const [periode, setPeriode] = useState('1a')
  const historique = useHistoriqueCours(cible.ticker, periode)

  const cours = etat.quotes[cible.ticker]
  const zone = zoneDe(cible.suivi)

  return (
    <div className="titre">
      <p className="titre__ticker">{cible.ticker}</p>

      {cours ? (
        <p className="titre__cours">
          {/* Un cours est une donnée de marché : il reste lisible même l'œil
              fermé, il ne dit rien de ce qu'on détient. */}
          <span className="num titre__prix">{formatDevise(cours.prix, cours.devise)}</span>
          {cours.variationJour != null && (
            <span className={`num ${cours.variationJour >= 0 ? 'titre__hausse' : 'titre__baisse'}`}>
              {cours.variationJour >= 0 ? '+' : ''}
              {formatteurPourcentage.format(cours.variationJour)} % aujourd’hui
            </span>
          )}
          <Age horodatage={cours.horodatage} />
        </p>
      ) : (
        <p className="titre__indisponible">Aucun cours connu pour cet instrument</p>
      )}

      <Graphique historique={historique} zone={zone} />
      <SelecteurPeriode valeur={periode} onChange={setPeriode} />

      {cible.position && <DetailPosition position={cible.position} cours={cours} etat={etat} />}
      {cible.suivi && <DetailSuivi suivi={cible.suivi} />}
    </div>
  )
}

function Graphique({ historique, zone }) {
  if (historique.statut === 'chargement') return <p className="titre__indisponible">Chargement de l’historique…</p>
  if (historique.statut === 'erreur') {
    // Hors ligne ou worker injoignable : le dire. Une courbe plate tracée à
    // la place se lirait comme un cours immobile.
    return <p className="titre__indisponible">Historique indisponible ({historique.erreur})</p>
  }

  return (
    <Courbe
      valeurs={historique.donnees.points.map((point) => point.cloture)}
      hauteur={120}
      zone={zone}
      messageVide="Pas d’historique pour cet instrument sur cette période"
    />
  )
}

function DetailPosition({ position, cours, etat }) {
  const tauxUsd = etat.fx['USD/EUR']?.taux ?? null
  const { valeurEur, coutRevientEur, plusValueEur } = valoriserPosition(position, cours, tauxUsd)
  const pourcentage = coutRevientEur ? (plusValueEur / coutRevientEur) * 100 : null

  return (
    <dl className="titre__detail">
      <Ligne libelle="Quantité">
        <Montant valeur={position.quantite} brut />
      </Ligne>
      <Ligne libelle="Prix de revient">
        <Montant valeur={position.pru} devise={position.devise} />
      </Ligne>
      <Ligne libelle="Valeur">
        {valeurEur === null ? <span className="titre__indisponible">inconnue</span> : <Montant valeur={valeurEur} />}
      </Ligne>
      {plusValueEur !== null && (
        <Ligne libelle="Plus-value latente">
          <Montant
            valeur={plusValueEur}
            signe
            className={plusValueEur >= 0 ? 'titre__hausse' : 'titre__baisse'}
          />
          {pourcentage !== null && (
            <span className="num titre__secondaire">
              {' '}
              ({pourcentage >= 0 ? '+' : ''}
              {formatteurPourcentage.format(pourcentage)} %)
            </span>
          )}
        </Ligne>
      )}
    </dl>
  )
}

function DetailSuivi({ suivi }) {
  return (
    <dl className="titre__detail">
      {suivi.zoneAchatMin != null && suivi.zoneAchatMax != null && (
        <Ligne libelle="Zone d’achat">
          <span className="num">
            {suivi.zoneAchatMin} – {suivi.zoneAchatMax}
          </span>
        </Ligne>
      )}
      {suivi.conviction && <Ligne libelle="Conviction">{suivi.conviction}</Ligne>}
      {suivi.horizon && <Ligne libelle="Horizon">{suivi.horizon}</Ligne>}
      {suivi.these && <Ligne libelle="Thèse">{suivi.these}</Ligne>}
      {suivi.risques && <Ligne libelle="Risques">{suivi.risques}</Ligne>}
    </dl>
  )
}

function Ligne({ libelle, children }) {
  return (
    <div className="titre__ligne">
      <dt className="titre__libelle">{libelle}</dt>
      <dd className="titre__valeur">{children}</dd>
    </div>
  )
}

/** Zone d'achat exploitable seulement si ses deux bornes sont connues : une
 * borne seule ne délimite rien. */
function zoneDe(suivi) {
  if (!suivi || suivi.zoneAchatMin == null || suivi.zoneAchatMax == null) return null
  return { min: suivi.zoneAchatMin, max: suivi.zoneAchatMax }
}
