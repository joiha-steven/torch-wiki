// torch.EDC.wiki service worker — hand-rolled, no build step (this is a
// customized Next 16 build; build-integrated PWA plugins are avoided on purpose).
//
// Strategy:
//   • Static, content-hashed assets (/_next/static, fonts, icons) → cache-first.
//     These are immutable, so serving from cache makes repeat opens instant and
//     removes the "reloading" feel.
//   • HTML navigations → network-first with a cached fallback, then an offline
//     page. Online users always get fresh data (the site is DB-driven); offline
//     users still see the last page they visited or a tidy offline screen.
//   • Everything else same-origin (API routes) and all cross-origin requests
//     (Supabase, Blob images, GA, Turnstile) → straight to network, never cached.
//
// Bump CACHE_VERSION to invalidate everything on the next activation.
const CACHE_VERSION = 'v1'
const STATIC_CACHE = `static-${CACHE_VERSION}`
const PAGE_CACHE = `pages-${CACHE_VERSION}`
const OFFLINE_URL = '/offline.html'

const PRECACHE = [OFFLINE_URL, '/icon-192.png', '/apple-touch-icon.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== PAGE_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/') ||
    /\.(?:woff2?|png|svg|ico|webmanifest)$/.test(url.pathname)
  )
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Only manage our own origin; let everything cross-origin go straight through.
  if (url.origin !== self.location.origin) return

  // HTML navigations: network-first, fall back to cache, then the offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(PAGE_CACHE).then((cache) => cache.put(request, copy))
          return res
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL)),
        ),
    )
    return
  }

  // Static hashed assets: cache-first, populate on miss.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok && res.type === 'basic') {
              const copy = res.clone()
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy))
            }
            return res
          }),
      ),
    )
    return
  }

  // Same-origin API and anything else: network only (never cache dynamic data).
})
