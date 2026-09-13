import { useState } from 'react'
import Section from '../components/Section.jsx'
import Row from '../components/Row.jsx'
import Barre from '../components/Barre.jsx'
import Montant from '../components/Montant.jsx'
import { groupesDe, partDuTotal } from './patrimoineAxes.js'
import './PatrimoineGroupes.css'

const LIBELLE_TYPE = { courant: 'Courant', epargne: 'Épargne', pea: 'PEA', cto: 'CTO' }
const LIBELLE_AXE = { classes: 'Par classe', institutions: 'Par institution' }

/** Les groupes du patrimoine, dépliables, sur l'axe choisi au-dessus. Chaque
 * groupe montre son montant, sa part du total et, s'il détient des titres, sa
 * plus-value latente. */
export default function PatrimoineGroupes({ axe, consolidation, institutions, quotes }) {
  const [ouverts, setOuverts] = useState(() => new Set())
  const groupes = groupesDe(axe, consolidation, institutions)

  const basculer = (cle) => {
    const suivant = new Set(ouverts)
    suivant.has(cle) ? suivant.delete(cle) : suivant.add(cle)
    setOuverts(suivant)
  }

  return (
    <Section titre={LIBELLE_AXE[axe]}>
      {groupes.map((groupe) => {
        const ouvert = ouverts.has(groupe.cle)
        const vide = groupe.comptes.length === 0 && groupe.positions.length === 0

        return (
          <div key={groupe.cle} className="groupes__groupe">
            <Row libelle={groupe.libelle} onClick={() => basculer(groupe.cle)}>
              <span className="groupes__chiffres">
                <Montant valeur={groupe.valeur} />
                {groupe.plusValue !== null && (
                  <Montant
                    valeur={groupe.plusValue}
                    signe
                    className={`groupes__pv ${groupe.plusValue >= 0 ? 'groupes__pv--pos' : 'groupes__pv--neg'}`}
                  />
                )}
              </span>
              <span className="groupes__chevron">{ouvert ? '▾' : '▸'}</span>
            </Row>

            <div className="groupes__barre">
              <Barre part={partDuTotal(groupe.valeur, consolidation.totalEur)} couleur={groupe.couleur} />
            </div>

            {ouvert && (
              <div className="groupes__detail">
                {groupe.comptes.map((ligne) => (
                  <CompteLigne key={ligne.compte.id} {...ligne} />
                ))}
                {groupe.positions.map((ligne) => (
                  <PositionLigne key={ligne.position.id} {...ligne} cours={quotes[ligne.position.ticker]} />
                ))}
                {vide && <p className="groupes__detail-vide">Rien dans ce groupe</p>}
              </div>
            )}
          </div>
        )
      })}
    </Section>
  )
}

function CompteLigne({ compte, montant, montantEur, note }) {
  return (
    <Row libelle={compte.libelle} sousLibelle={note ? `${LIBELLE_TYPE[compte.type]} · ${note}` : LIBELLE_TYPE[compte.type]}>
      <span className="groupes__valeur">
        <Montant valeur={montant} devise={compte.devise} />
        {compte.devise !== 'EUR' &&
          (montantEur === null ? (
            // Surtout pas un montant converti par défaut : « 0,00 € » se
            // lirait comme un compte vide.
            <span className="groupes__sans-valeur">sans taux</span>
          ) : (
            <Montant valeur={montantEur} className="groupes__secondaire" />
          ))}
      </span>
    </Row>
  )
}

function PositionLigne({ position, compte, valeurEur, plusValueEur, coursManquant, nonConverti, cours }) {
  return (
    <Row
      libelle={cours?.nom ?? position.ticker}
      sousLibelle={
        <>
          {position.ticker} · {compte?.libelle ?? ''} · <Montant valeur={position.quantite} brut /> ×{' '}
          <Montant valeur={position.pru} devise={position.devise} />
        </>
      }
    >
      <span className="groupes__valeur">
        {/* Le premier signal qu'on suit le mauvais instrument (CLAUDE.md
            § « Le ticker ne suffit pas ») : jamais une conversion silencieuse. */}
        {cours && cours.devise !== position.devise && (
          <span className="groupes__devise-alerte">
            ⚠ {cours.devise} ≠ {position.devise}
          </span>
        )}
        {coursManquant || nonConverti ? (
          <span className="groupes__sans-valeur">{coursManquant ? 'sans cours' : 'sans taux'}</span>
        ) : (
          <>
            <Montant valeur={valeurEur} />
            {plusValueEur !== null && (
              <Montant
                valeur={plusValueEur}
                signe
                className={`groupes__secondaire ${plusValueEur >= 0 ? 'groupes__pv--pos' : 'groupes__pv--neg'}`}
              />
            )}
          </>
        )}
      </span>
    </Row>
  )
}
