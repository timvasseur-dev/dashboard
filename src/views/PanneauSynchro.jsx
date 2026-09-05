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
import { synchroniserMaintenant, resoudreConflit } from '../data/sync.js'
import { consolider } from '../lib/portfolio.js'
import { formatEur } from '../lib/money.js'
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
      </Section>

      <Sheet titre="Conflit de synchronisation" ouvert={statut.conflit !== null} onFermer={() => {}}>
        {statut.conflit && <ResolutionConflit conflit={statut.conflit} />}
      </Sheet>
    </>
  )
}

// consolider() ne reçoit jamais l'état complet (cf. CLAUDE.md § 3) : même
// règle ici, on ne lui passe que le sous-ensemble attendu.
function sousEnsemble(etat) {
  const { institutions, accounts, balances, positions, quotes, fx } = etat
  return { institutions, accounts, balances, positions, quotes, fx }
}

function ResolutionConflit({ conflit }) {
  const totalLocal = consolider(sousEnsemble(conflit.local)).totalEur
  const totalDistant = consolider(sousEnsemble(conflit.distant)).totalEur

  return (
    <div className="synchro__conflit">
      <p className="synchro__avertissement">
        Cet appareil et un autre ont été modifiés depuis la dernière synchronisation. Choisissez la version à garder
        — l'autre sera écrasée, aucune fusion n'est possible.
      </p>
      <Row libelle="Cet appareil" sousLibelle={new Date(conflit.local.dernierModification).toLocaleString('fr-FR')}>
        <span className="num">{formatEur(totalLocal)}</span>
      </Row>
      <Row libelle="Autre appareil" sousLibelle={new Date(conflit.distant.dernierModification).toLocaleString('fr-FR')}>
        <span className="num">{formatEur(totalDistant)}</span>
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
