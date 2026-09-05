/* Pocket service worker — app-shell cache so the PWA launches offline. */
const CACHE = 'pocket-v3'
const SHELL = ['/', '/index.html', '/manifest.json']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(SHELL.map((url) => c.add(url))))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.pathname.startsWith('/api/')) return // never cache API traffic

  const sameOrigin = url.origin === self.location.origin
  // Icons / images change between releases — always try the network first so a
  // new logo shows up on the next reload, falling back to cache only offline.
  const isImage = /\.(png|ico|svg|jpg|jpeg|webp|gif)$/i.test(url.pathname)

  if (request.mode === 'navigate' || (sameOrigin && isImage)) {
    e.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok && sameOrigin) {
            const copy = res.clone()
            const key = request.mode === 'navigate' ? '/index.html' : request
            caches.open(CACHE).then((c) => c.put(key, copy))
          }
          return res
        })
        .catch(() =>
          caches.match(request.mode === 'navigate' ? '/index.html' : request)
        )
    )
    return
  }

  // Hashed JS/CSS and other static assets: cache first, then network.
  e.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res.ok && sameOrigin) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(request, copy))
          }
          return res
        })
    )
  )
})
