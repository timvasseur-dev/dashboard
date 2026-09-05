import { useState } from 'react'
import Screen from '../components/Screen.jsx'
import Section from '../components/Section.jsx'
import Row from '../components/Row.jsx'
import Age from '../components/Age.jsx'
import { useEtat, remplacerEtat, chargerDemo } from '../data/store.js'
import { validerEtatImporte } from '../data/storage.js'
import { XPF_PAR_EUR } from '../lib/money.js'
import PanneauSynchro from './PanneauSynchro.jsx'
import './Reglages.css'

export default function Reglages() {
  const etat = useEtat()
  const [colle, setColle] = useState('')
  const [message, setMessage] = useState('')
  const tauxUsd = etat.fx['USD/EUR']

  const texteExport = () => JSON.stringify(etat, null, 2)

  const exporter = async () => {
    const texte = texteExport()
    const fichier = new File([texte], 'vv-patrimoine.json', { type: 'application/json' })

    if (navigator.canShare?.({ files: [fichier] })) {
      try {
        await navigator.share({ files: [fichier] })
        return
      } catch {
        // partage annulé : on retombe sur le téléchargement
      }
    }

    const lien = document.createElement('a')
    lien.href = URL.createObjectURL(fichier)
    lien.download = fichier.name
    lien.click()
    URL.revokeObjectURL(lien.href)
  }

  const copier = async () => {
    await navigator.clipboard.writeText(texteExport())
    setMessage('JSON copié.')
  }

  const importerTexte = (texte) => {
    let candidat
    try {
      candidat = JSON.parse(texte)
    } catch {
      setMessage('JSON illisible.')
      return
    }
    if (!validerEtatImporte(candidat)) {
      setMessage('Format inattendu, import refusé.')
      return
    }
    if (!window.confirm('Importer remplace toutes les données actuelles. Continuer ?')) return
    remplacerEtat(candidat)
    setColle('')
    setMessage('Import réussi.')
  }

  const surFichier = (e) => {
    const fichier = e.target.files[0]
    if (!fichier) return
    fichier.text().then(importerTexte)
    e.target.value = ''
  }

  return (
    <Screen title="Réglages" subtitle="Taux, export, import">
      <Section titre="Taux de change">
        <Row libelle="USD/EUR" sousLibelle="1 USD en euros, récupéré depuis l'écran Marché">
          {tauxUsd ? (
            <span>
              <span className="num">{tauxUsd.taux.toFixed(4)}</span> <Age horodatage={tauxUsd.horodatage} />
            </span>
          ) : (
            <span className="indisponible">indisponible</span>
          )}
        </Row>
        <p className="reglages__note">XPF/EUR est un taux fixe : 1 EUR = {XPF_PAR_EUR} XPF.</p>
      </Section>

      <PanneauSynchro />

      <Section titre="Données">
        <Row
          libelle="Charger le jeu de démonstration"
          onClick={() => {
            if (window.confirm('Cela remplace comptes, soldes, positions et watchlist actuels. Continuer ?')) {
              chargerDemo()
            }
          }}
        />
        <Row libelle="Exporter en JSON" onClick={exporter} />
        <Row libelle="Copier le JSON" onClick={copier} />
      </Section>

      <Section titre="Importer">
        <div className="reglages__import">
          <input type="file" accept="application/json" onChange={surFichier} className="reglages__fichier" />
          <textarea
            className="reglages__collage"
            placeholder="Ou coller le JSON ici"
            value={colle}
            onChange={(e) => setColle(e.target.value)}
          />
          <button className="comptes__valider" onClick={() => importerTexte(colle)}>
            Importer le texte collé
          </button>
        </div>
      </Section>

      {message && <p className="reglages__message">{message}</p>}
    </Screen>
  )
}
