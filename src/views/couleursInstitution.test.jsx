import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import Section from '../components/Section.jsx'
import { couleurInstitution, COULEUR_INCONNUE, TOKENS } from './couleursInstitution.js'

const theme = readFileSync('src/styles/theme.css', 'utf8')

/** Valeur d'une variable de theme.css, en hex. `null` si elle n'y est pas. */
function valeurToken(token) {
  const nom = token.replace(/^var\(|\)$/g, '')
  return theme.match(new RegExp(`^\\s*${nom}\\s*:\\s*(#[0-9A-Fa-f]{6})\\s*;`, 'm'))?.[1] ?? null
}

function luminance(hex) {
  const canal = (deux) => {
    const c = parseInt(deux, 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * canal(hex.slice(1, 3)) + 0.7152 * canal(hex.slice(3, 5)) + 0.0722 * canal(hex.slice(5, 7))
}

const contraste = (a, b) => {
  const [clair, sombre] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (clair + 0.05) / (sombre + 0.05)
}

describe('couleurInstitution', () => {
  it('donne son token à chacune des quatre institutions', () => {
    expect(couleurInstitution('BCI')).toBe('var(--inst-bci)')
    expect(couleurInstitution('Boursobank')).toBe('var(--inst-boursobank)')
    expect(couleurInstitution("Caisse d'Épargne")).toBe('var(--inst-caisse-epargne)')
    expect(couleurInstitution('IBKR')).toBe('var(--inst-ibkr)')
  })

  /* L'appariement se fait sur le nom : renommer une institution lui fait
   * perdre sa couleur. Le repli doit donc être une vraie couleur. */
  it('replie une institution inconnue, un nom vide ou absent', () => {
    expect(couleurInstitution('Banque inconnue')).toBe(COULEUR_INCONNUE)
    expect(couleurInstitution('BCI ')).toBe(COULEUR_INCONNUE)
    expect(couleurInstitution('')).toBe(COULEUR_INCONNUE)
    expect(couleurInstitution(undefined)).toBe(COULEUR_INCONNUE)
  })

  it('ne se fait pas piéger par une clé héritée du prototype', () => {
    expect(couleurInstitution('constructor')).toBe(COULEUR_INCONNUE)
    expect(couleurInstitution('toString')).toBe(COULEUR_INCONNUE)
  })
})

/*
 * Le test qui compte vraiment. Un `var()` non défini ne lève aucune erreur :
 * il peint transparent. Une institution renommée afficherait donc une
 * pastille invisible, sans que rien ne le signale — ni à la compilation, ni à
 * l'exécution, ni dans la console.
 */
describe('les tokens existent et sont visibles', () => {
  it('chaque token renvoyable est défini dans theme.css', () => {
    for (const token of TOKENS) {
      expect(valeurToken(token), `${token} absent de theme.css : peindrait transparent`).not.toBeNull()
    }
  })

  it('le repli est une couleur pleine, ni transparente ni noire', () => {
    const hex = valeurToken(COULEUR_INCONNUE)
    expect(hex).not.toBeNull()
    expect(hex).not.toBe('#000000')
    // visible sur --bg : 3:1 est le seuil d'un élément graphique non textuel
    expect(contraste(hex, '#0A1121')).toBeGreaterThan(3)
  })

  it('peint la pastille d’une institution inconnue avec le repli', () => {
    const html = renderToStaticMarkup(<Section titre="Banque renommée" couleur={couleurInstitution('Banque renommée')} />)
    expect(html).toContain('background:var(--inst-autre)')
  })
})

/*
 * Les règles visuelles, gardées là où les valeurs vivent désormais. Elles
 * étaient dans migrations.test.js, qui surveillait des couleurs que plus
 * personne ne lit.
 */
describe('les quatre couleurs restent distinguables', () => {
  const quatre = TOKENS.filter((t) => t !== COULEUR_INCONNUE).map(valeurToken)

  it('sont quatre valeurs définies et distinctes', () => {
    expect(quatre.every(Boolean)).toBe(true)
    expect(new Set(quatre).size).toBe(4)
  })

  /* Quatre hex différents ne suffisent pas : la première série en avait
   * quatre, et ses segments étaient indistinguables sur l'anneau comme sur
   * les pastilles de 8 px. Ce qui les séparait — la teinte seule — ne survit
   * pas à une tache de 8 px. La clarté, si. Rapports de luminance triés :
   * 1,67, 1,08 et 1,06 pour la série rejetée ; 1,80, 1,74 et 1,52 ici. */
  it('écartent les clartés, pas seulement les teintes', () => {
    const triees = quatre.map(luminance).sort((a, b) => a - b)
    for (let i = 1; i < triees.length; i += 1) {
      expect(triees[i] / triees[i - 1]).toBeGreaterThan(1.3)
    }
  })

  it('n’empruntent ni l’or de l’interface, ni le vert ou le rouge de variation', () => {
    const reserves = ['--accent', '--positive', '--negative', '--alerte']
      .map((nom) => valeurToken(`var(${nom})`).toLowerCase())
    for (const couleur of quatre) {
      expect(reserves).not.toContain(couleur.toLowerCase())
    }
  })
})
