import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { registerServiceWorker } from './lib/pwa.js'
import './styles/theme.css'
import './styles/base.css'

// Récupéré avant le rendu : le noeud existe dans index.html, il disparaît
// juste après.
const splash = document.getElementById('splash-screen')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Le splash s'efface au premier rendu, pas à la fin du chargement des données.
// L'état vient du localStorage et est disponible tout de suite ; attendre les
// cours ferait durer l'écran plusieurs secondes à chaque ouverture.
//
// Deux trames : la première laisse React peindre, la seconde lance le fondu
// sur une interface déjà présente derrière. Le retrait est programmé par
// minuterie plutôt que sur transitionend, qui ne se déclenche pas si la
// transition est désactivée — le splash resterait alors en travers de l'écran.
if (splash) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      splash.classList.add('parti')
      setTimeout(() => splash.remove(), 220)
    })
  })
}

registerServiceWorker()
