/*
 * Enregistrement du service worker.
 * Uniquement en production : en développement, un SW actif masque les
 * modifications et complique le débogage.
 */
export function registerServiceWorker() {
  if (!import.meta.env.PROD) return
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL,
      })
      .catch(() => {
        // hors ligne au premier chargement : l'application fonctionne quand même
      })
  })
}
