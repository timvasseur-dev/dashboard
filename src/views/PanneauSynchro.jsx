import { useState } from 'react'
import Section from '../components/Section.jsx'
import Row from '../components/Row.jsx'
import Field from '../components/Field.jsx'
import Sheet from '../components/Sheet.jsx'
import Age from '../components/Age.jsx'
import { useStatutSynchronisation } from '../data/statutSynchronisation.js'
import { chargerJeton, sauvegarderJeton, chargerDerniereSync } from '../data/syncLocal.js'
import { testerConnexion } from '../data/syncApi.js'
import { definirPhrase, oublierPhrase } from '../data/cleChiffrement.js'
import { synchroniserMaintenant, resoudreConflit, ecraserDistantAvecLocal, ecraserLocalAvecDistant } from '../data/sync.js'
import Montant from '../components/Montant.jsx'
import './PanneauSynchro.css'

// Exactement 3 issues pour le test de connexion (cf. CLAUDE.md § 7) : jamais
// un 4e cas silencieux.
const MESSAGES_TEST = {
  valide: 'Jeton valide.',
  refuse: 'Jeton refusé par le worker.',
  injoignable: 'Worker injoignable.',
}

export default function PanneauSynchro() {
  const statut = useStatutSynchronisation()
  const [jeton, setJeton] = useState(chargerJeton())
  const [phrase, setPhrase] = useState('')
  const [testEnCours, setTestEnCours] = useState(false)
  const [resultatTest, setResultatTest] = useState('')
  const [messagePhrase, setMessagePhrase] = useState('')
  const derniereSync = chargerDerniereSync()

  const enregistrerJeton = () => {
    sauvegarderJeton(jeton.trim())
    setResultatTest('')
  }

  const tester = async () => {
    setTestEnCours(true)
    setResultatTest('')
    setResultatTest(MESSAGES_TEST[await testerConnexion(jeton.trim())])
    setTestEnCours(false)
  }

  const validerPhrase = async () => {
    if (!phrase) return
    await definirPhrase(phrase)
    setPhrase('')
    setMessagePhrase('Phrase enregistrée sur cet appareil.')
  }

  const oublier = () => {
    oublierPhrase()
    setMessagePhrase('Phrase oubliée sur cet appareil.')
  }

  const confirmerEtEcraserDistant = () => {
    if (
      window.confirm(
        'Remplacer la version distante par les données de cet appareil ? Les autres appareils perdront leurs modifications non synchronisées.'
      )
    ) {
      ecraserDistantAvecLocal()
    }
  }

  const confirmerEtEcraserLocal = () => {
    if (
      window.confirm(
        'Remplacer les données de cet appareil par la version distante ? Les modifications locales non synchronisées seront perdues.'
      )
    ) {
      ecraserLocalAvecDistant()
    }
  }

  return (
    <>
      <Section titre="Synchronisation">
        <div className="synchro__champ">
          <Field label="Jeton d'API" type="password" value={jeton} onChange={(e) => setJeton(e.target.value)} />
          <div className="synchro__boutons">
            <button className="comptes__valider" onClick={enregistrerJeton} disabled={!jeton.trim()}>
              Enregistrer
            </button>
            <button className="comptes__valider" onClick={tester} disabled={!jeton.trim() || testEnCours}>
              {testEnCours ? 'Test…' : 'Tester la connexion'}
            </button>
          </div>
          {resultatTest && <p className="synchro__message">{resultatTest}</p>}
        </div>

        <div className="synchro__champ">
          <Field
            label="Phrase secrète"
            type="password"
            placeholder="Pour chiffrer l'état avant envoi"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
          />
          <p className="synchro__avertissement">
            Si vous perdez cette phrase, les données synchronisées dans le cloud sont irrécupérables — l'export JSON
            en clair (section « Données » ci-dessus) reste votre seul filet de sécurité.
          </p>
          <div className="synchro__boutons">
            <button className="comptes__valider" onClick={validerPhrase} disabled={!phrase}>
              Enregistrer la phrase
            </button>
            <button className="comptes__supprimer" onClick={oublier}>
              Oublier la phrase sur cet appareil
            </button>
          </div>
          {messagePhrase && <p className="synchro__message">{messagePhrase}</p>}
        </div>

        <Row libelle="Dernière synchro réussie" sousLibelle={statut.dernierMessage ?? ''}>
          {derniereSync ? <Age horodatage={derniereSync} /> : <span className="indisponible">jamais</span>}
        </Row>
        {statut.totaux && (
          <Row libelle="Total consolidé" sousLibelle="cet appareil · distant">
            <span
              className={
                statut.totaux.distant !== null && statut.totaux.distant !== statut.totaux.local
                  ? 'synchro__divergence'
                  : undefined
              }
            >
              <Montant valeur={statut.totaux.local} /> ·{' '}
              {statut.totaux.distant !== null ? (
                <Montant valeur={statut.totaux.distant} />
              ) : (
                'jamais synchronisé'
              )}
            </span>
          </Row>
        )}
        {statut.derniereErreur && (
          <p className="synchro__erreur">
            Échec ({statut.derniereErreur})
            {derniereSync && (
              <>
                {' '}
                — dernière réussite <Age horodatage={derniereSync} />
              </>
            )}
          </p>
        )}

        <button className="comptes__valider synchro__pleine-largeur" onClick={synchroniserMaintenant} disabled={statut.enCours}>
          {statut.enCours ? 'Synchronisation…' : 'Synchroniser maintenant'}
        </button>

        <div className="synchro__champ">
          <p className="synchro__avertissement">
            Dernier recours en cas de divergence : écrase entièrement un des deux côtés avec l'autre, sans fusion.
          </p>
          <div className="synchro__boutons">
            <button className="comptes__supprimer" onClick={confirmerEtEcraserDistant} disabled={statut.enCours || !jeton.trim()}>
              Écraser avec ma version locale
            </button>
            <button className="comptes__supprimer" onClick={confirmerEtEcraserLocal} disabled={statut.enCours || !jeton.trim()}>
              Écraser avec la version distante
            </button>
          </div>
        </div>
      </Section>

      <Sheet titre="Conflit de synchronisation" ouvert={statut.conflit !== null} onFermer={() => {}}>
        {statut.conflit && <ResolutionConflit conflit={statut.conflit} totaux={statut.totaux} />}
      </Sheet>
    </>
  )
}

// Les totaux sont déjà calculés par sync.js au moment où un conflit est
// détecté (cf. definirTotaux dans verifierSynchronisation/synchroniserMaintenant) :
// on les réutilise plutôt que d'appeler consolider() une seconde fois ici.
function ResolutionConflit({ conflit, totaux }) {
  return (
    <div className="synchro__conflit">
      <p className="synchro__avertissement">
        Cet appareil et un autre ont été modifiés depuis la dernière synchronisation. Choisissez la version à garder
        — l'autre sera écrasée, aucune fusion n'est possible.
      </p>
      <Row libelle="Cet appareil" sousLibelle={new Date(conflit.local.dernierModification).toLocaleString('fr-FR')}>
        <Montant valeur={totaux.local} />
      </Row>
      <Row libelle="Autre appareil" sousLibelle={new Date(conflit.distant.dernierModification).toLocaleString('fr-FR')}>
        <Montant valeur={totaux.distant} />
      </Row>
      <div className="synchro__boutons">
        <button className="comptes__valider" onClick={() => resoudreConflit('local')}>
          Garder cet appareil
        </button>
        <button className="comptes__valider" onClick={() => resoudreConflit('distant')}>
          Garder l'autre appareil
        </button>
      </div>
    </div>
  )
}
