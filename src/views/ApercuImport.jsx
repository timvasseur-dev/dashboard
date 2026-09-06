import { formatDevise } from '../lib/money.js'
import { formatDateAffichee } from '../lib/date.js'
import Row from '../components/Row.jsx'
import './ApercuImport.css'

/**
 * Aperçu avant validation : encodage détecté, compteurs nouveau / doublon /
 * erreur, un extrait des lignes qui seront réellement écrites, puis
 * confirmation explicite. L'import n'écrit rien tant que « Confirmer » n'a
 * pas été tapé (cf. CLAUDE.md § phase 5).
 */
export default function ApercuImport({ resultat, onConfirmer, onAnnuler }) {
  const { aInserer, doublons, erreurs, encodage } = resultat
  const echantillonUnique = aInserer.length <= 10

  return (
    <div className="apercu">
      <p className="apercu__encodage">Encodage détecté : {encodage}</p>

      <div className="apercu__compteurs">
        <Compteur valeur={aInserer.length} libelle="nouvelles" />
        <Compteur valeur={doublons.length} libelle="doublons ignorés" />
        <Compteur valeur={erreurs.length} libelle="lignes en erreur" />
      </div>

      {erreurs.length > 0 && (
        <ul className="apercu__erreurs">
          {erreurs.map((e, i) => (
            <li key={i}>
              Ligne {e.ligne} : {e.message}
            </li>
          ))}
        </ul>
      )}

      {aInserer.length > 0 && (
        <div className="apercu__extrait">
          <p className="apercu__extrait-titre">
            {echantillonUnique
              ? `Les ${aInserer.length} ligne${aInserer.length > 1 ? 's' : ''} à importer`
              : 'Extrait : 5 premières et 5 dernières lignes à importer'}
          </p>
          {(echantillonUnique ? aInserer : aInserer.slice(0, 5)).map((t, i) => (
            <LigneApercu key={i} transaction={t} />
          ))}
          {!echantillonUnique && (
            <>
              <p className="apercu__extrait-separateur">… {aInserer.length - 10} autres lignes …</p>
              {aInserer.slice(-5).map((t, i) => (
                <LigneApercu key={i} transaction={t} />
              ))}
            </>
          )}
        </div>
      )}

      <p className="apercu__aide">
        Deux achats identiques le même jour au même montant sont conservés comme deux
        opérations distinctes, pas comme un doublon — cf. la note sur le dédoublonnage.
      </p>

      <button
        className="apercu__confirmer"
        disabled={aInserer.length === 0}
        onClick={() => onConfirmer(aInserer)}
      >
        Confirmer l'import de {aInserer.length} mouvement{aInserer.length > 1 ? 's' : ''}
      </button>
      <button className="apercu__annuler" onClick={onAnnuler}>
        Annuler
      </button>
    </div>
  )
}

function Compteur({ valeur, libelle }) {
  return (
    <div className="apercu__compteur">
      <span className="apercu__valeur num">{valeur}</span>
      <span className="apercu__libelle">{libelle}</span>
    </div>
  )
}

function LigneApercu({ transaction }) {
  return (
    <Row libelle={transaction.libelle} sousLibelle={formatDateAffichee(transaction.date)}>
      <span
        className={
          'num apercu__montant ' + (transaction.montant < 0 ? 'apercu__montant--negatif' : 'apercu__montant--positif')
        }
      >
        {formatDevise(transaction.montant, transaction.devise)}
      </span>
    </Row>
  )
}
