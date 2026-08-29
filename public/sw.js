/*
 * Service worker minimal : met en cache la coquille de l'application.
 * Servi tel quel depuis /dashboard/sw.js, donc son scope est /dashboard/.
 *
 * Deux stratégies seulement :
 *  - navigations : réseau d'abord, cache en repli (hors ligne)
 *  - assets hachés : cache d'abord, ils sont immuables par construction
 */

const VERSION = 'v1'
const CACHE = `vv-shell-${VERSION}`
const BASE = '/dashboard/'

const SHELL = [
  BASE,
  `${BASE}manifest.webmanifest`,
  `${BASE}icons/icon-192.png`,
  `${BASE}icons/icon-512.png`,
  `${BASE}icons/apple-touch-icon.png`,
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // addAll échoue en bloc : on tolère l'absence d'un fichier
      .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
    return
  }

  if (url.pathname.startsWith(`${BASE}assets/`)) {
    event.respondWith(cacheFirst(request))
  }
})

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    const cache = await caches.open(CACHE)
    cache.put(BASE, response.clone())
    return response
  } catch {
    const cached = await caches.match(BASE)
    return cached ?? Response.error()
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(CACHE)
    cache.put(request, response.clone())
  }
  return response
}
