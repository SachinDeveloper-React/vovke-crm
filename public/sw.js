/*
 * The panel's service worker.
 *
 * What it caches is decided by one rule: only what is the same for every
 * operator and can never be stale.
 *
 *   - `/_next/static/*` — the JS, CSS and fonts of a build (the Geist woff2
 *     files live under `/_next/static/media/`). Every file name carries a
 *     content hash, so a cached copy is right forever: cache-first.
 *   - Images from another origin — the media library's photos on the S3
 *     bucket / CDN. An upload's key is unique and never reused (renaming
 *     changes the label, not the URL), so cache-first is right here too.
 *     Fetched with CORS and cached only when the bucket allows it: an image
 *     fetched without CORS is an *opaque* response, which Chrome charges
 *     ~7 MB of quota for whatever its size and whose status nobody can read
 *     — caching those would fill the quota with what might be error pages.
 *     Where CORS is refused the image simply loads as it would with no
 *     worker. Capped at MAX_IMAGE_ENTRIES, oldest dropped first.
 *   - `/iconify/<version>/*` — the page icons, at a URL that carries a hash
 *     of the whole set: cache-first, like a build file.
 *   - `/icons/*`, `/favicon.ico` — the app's own icons: cache-first.
 *   - Pages (navigations) — **never cached.** Every page here is a member's
 *     account, an order book, a fraud case: data that is private to whoever
 *     is signed in and wrong the moment it is a minute old. A navigation goes
 *     to the network; only when the network itself fails does the offline
 *     page answer instead of the browser's dinosaur.
 *   - Everything else — RSC payloads, Server Actions (POST), `/api/*` — is
 *     not touched at all and goes to the network exactly as without a worker.
 *
 * Bump VERSION to throw away every cache this worker made.
 */
const VERSION = 'v1';
const STATIC_CACHE = `vokve-static-${VERSION}`;
const SHELL_CACHE = `vokve-shell-${VERSION}`;
const IMAGE_CACHE = `vokve-images-${VERSION}`;
const OFFLINE_URL = '/offline.html';
const SHELL = [OFFLINE_URL, '/icons/icon.svg', '/icons/icon-192.png', '/favicon.ico'];
/** A build is a few hundred files; old builds' hashes are trimmed past this. */
const MAX_STATIC_ENTRIES = 400;
/** A media-library page shows up to 60; this keeps the last few pages' worth. */
const MAX_IMAGE_ENTRIES = 300;
/** Origins that refused a CORS read this session: asked plainly from then on, not twice per image. */
const noCors = new Set();

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL)));
  // Not `skipWaiting()` here: a new worker waits until the page says so
  // (the "new version" prompt), so an open form is never swapped under the
  // operator mid-edit.
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keep = new Set([STATIC_CACHE, SHELL_CACHE, IMAGE_CACHE]);
      for (const name of await caches.keys()) {
        if (name.startsWith('vokve-') && !keep.has(name)) await caches.delete(name);
      }
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    if (request.destination === 'image' && url.protocol === 'https:') event.respondWith(remoteImage(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkOrOffline(event));
    return;
  }
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/iconify/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE, true));
    return;
  }
  if (url.pathname.startsWith('/icons/') || url.pathname === '/favicon.ico') {
    event.respondWith(cacheFirst(request, SHELL_CACHE, false));
  }
});

async function networkOrOffline(event) {
  try {
    const preloaded = await event.preloadResponse;
    if (preloaded) return preloaded;
    return await fetch(event.request);
  } catch {
    const offline = await caches.match(OFFLINE_URL);
    return offline || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

async function cacheFirst(request, cacheName, trim) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok && response.type === 'basic') {
    await cache.put(request, response.clone());
    if (trim) trimCache(cache, MAX_STATIC_ENTRIES);
  }
  return response;
}

async function remoteImage(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const hit = await cache.match(request.url);
  if (hit) return hit;

  const origin = new URL(request.url).origin;
  if (!noCors.has(origin)) {
    try {
      const response = await fetch(request.url, { mode: 'cors', credentials: 'omit' });
      if (response.ok) {
        await cache.put(request.url, response.clone());
        trimCache(cache, MAX_IMAGE_ENTRIES);
      }
      return response;
    } catch {
      // A CORS refusal and a dead network look the same from here. Either
      // way the plain request below is the right next step: it loads the
      // image where CORS was the problem, and fails as it would have anyway
      // where the network was.
      // Remembered only when online, so a moment offline does not stop
      // the bucket's images being cached for the rest of the session.
      if (self.navigator.onLine) noCors.add(origin);
    }
  }
  return fetch(request);
}

async function trimCache(cache, max) {
  const keys = await cache.keys();
  // Oldest first: `keys()` returns entries in insertion order.
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}
