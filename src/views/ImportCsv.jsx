import { useEffect, useState } from 'react'
import { useEtat, ajouterProfilImport } from '../data/store.js'
import { previsualiserImport, confirmerImport } from '../data/importBancaire.js'
import { useHashRoute, navigate } from '../lib/router.js'
import { decoderTexte } from '../lib/encodageCsv.js'
import { decouperLignes } from '../lib/csv.js'
import Screen from '../components/Screen.jsx'
import CorrespondanceColonnes from './CorrespondanceColonnes.jsx'
import ApercuImport from './ApercuImport.jsx'
import './ImportCsv.css'

function idCompteDepuisChemin(chemin) {
  return chemin.match(/^\/comptes\/([^/]+)\//)?.[1] ?? null
}

/**
 * Import d'un relevé bancaire : choix du compte, du fichier, d'un profil de
 * correspondance (existant ou nouveau), puis aperçu avant confirmation. Ne
 * touche jamais au store avant la confirmation explicite (`ApercuImport`).
 */
export default function ImportCsv() {
  const etat = useEtat()
  const chemin = useHashRoute()
  const idDepuisChemin = idCompteDepuisChemin(chemin)

  const [accountId, setAccountId] = useState(idDepuisChemin ?? etat.accounts[0]?.id ?? '')
  const [file, setFile] = useState(null)
  const [profilId, setProfilId] = useState('')
  const [lignesBrutes, setLignesBrutes] = useState(null)
  const [resultat, setResultat] = useState(null)
  const [enAnalyse, setEnAnalyse] = useState(false)
  const [erreurAnalyse, setErreurAnalyse] = useState('')
  const [termine, setTermine] = useState(false)

  const compte = etat.accounts.find((c) => c.id === accountId)
  const institutionId = compte?.institutionId
  const profilsDisponibles = etat.profilsImport.filter((p) => p.institutionId === institutionId)
  const profilActif = profilId === 'nouveau' ? null : profilsDisponibles.find((p) => p.id === profilId) ?? null

  useEffect(() => {
    if (!file || profilId !== 'nouveau') {
      setLignesBrutes(null)
      return
    }
    let annule = false
    file.arrayBuffer().then((tampon) => {
      if (!annule) setLignesBrutes(decouperLignes(decoderTexte(new Uint8Array(tampon)).texte))
    })
    return () => {
      annule = true
    }
  }, [file, profilId])

  const analyser = async () => {
    if (!file || !profilActif || !compte) return
    setEnAnalyse(true)
    setErreurAnalyse('')
    try {
      setResultat(await previsualiserImport({ file, profil: profilActif, accountId, devise: compte.devise }))
    } catch (err) {
      setErreurAnalyse(err.message)
    } finally {
      setEnAnalyse(false)
    }
  }

  if (!compte) {
    return (
      <Screen title="Importer un relevé">
        <p className="import__erreur">Compte introuvable.</p>
      </Screen>
    )
  }

  if (termine) {
    return (
      <Screen title="Importer un relevé">
        <div className="import__termine">
          <p>Import terminé.</p>
          <button onClick={() => navigate(`/comptes/${accountId}/mouvements`)}>Voir les mouvements</button>
        </div>
      </Screen>
    )
  }

  if (resultat) {
    return (
      <Screen title="Importer un relevé" subtitle={compte.libelle}>
        <ApercuImport
          resultat={resultat}
          onConfirmer={(aInserer) => {
            confirmerImport(aInserer)
            setTermine(true)
          }}
          onAnnuler={() => setResultat(null)}
        />
      </Screen>
    )
  }

  return (
    <Screen title="Importer un relevé" subtitle={compte.libelle}>
      <div className="import__choix">
        <label className="import__champ-select">
          <span className="field__label">Compte</span>
          <select
            value={accountId}
            onChange={(e) => {
              setAccountId(e.target.value)
              setProfilId('')
              setResultat(null)
            }}
          >
            {etat.accounts.map((c) => (
              <option key={c.id} value={c.id}>
                {etat.institutions.find((i) => i.id === c.institutionId)?.nom} — {c.libelle}
              </option>
            ))}
          </select>
        </label>

        <label className="import__champ-select">
          <span className="field__label">Fichier CSV</span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              setFile(e.target.files[0] ?? null)
              setErreurAnalyse('')
            }}
          />
        </label>

        <label className="import__champ-select">
          <span className="field__label">Profil de correspondance</span>
          <select value={profilId} onChange={(e) => setProfilId(e.target.value)}>
            <option value="">— choisir —</option>
            {profilsDisponibles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
            <option value="nouveau">+ Nouveau profil…</option>
          </select>
        </label>

        {profilId === 'nouveau' &&
          (!file ? (
            <p className="import__aide">Choisis d'abord un fichier pour régler la correspondance.</p>
          ) : lignesBrutes === null ? (
            <p className="import__aide">Lecture du fichier…</p>
          ) : (
            <CorrespondanceColonnes
              lignesBrutes={lignesBrutes}
              onEnregistrer={(donnees) => setProfilId(ajouterProfilImport({ ...donnees, institutionId }))}
              onAnnuler={() => setProfilId('')}
            />
          ))}

        {erreurAnalyse && <p className="import__erreur">{erreurAnalyse}</p>}

        {profilActif && (
          <button className="import__analyser" disabled={!file || enAnalyse} onClick={analyser}>
            {enAnalyse ? 'Analyse…' : 'Analyser le fichier'}
          </button>
        )}
      </div>
    </Screen>
  )
}
