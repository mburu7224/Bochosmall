/* Service Worker for Ruiru Media House — network-first strategy
   Caches core static assets for offline fallback only.
   CSS/JS always fetched fresh from network first.
*/

const CACHE_NAME = 'ruiru-static-v3';
const IMAGES_CACHE = 'ruiru-images-v1';

const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/css/base.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/content.css',
  '/css/responsive.css',
  '/css/theme.css',
  '/localstorage.js',
  '/script.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME && key !== IMAGES_CACHE) {
          return caches.delete(key);
        }
      })
    ))
    .then(() => self.clients.claim())
  );
});

function isImageRequest(request) {
  return request.destination === 'image' || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(new URL(request.url).pathname);
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Images: network-first, cache fallback
  if (isImageRequest(request)) {
    event.respondWith(
      caches.open(IMAGES_CACHE).then(cache =>
        fetch(request).then(response => {
          try { cache.put(request, response.clone()); } catch (e) {}
          return response;
        }).catch(() => cache.match(request))
      )
    );
    return;
  }

  // Everything else (HTML, CSS, JS): network-first, cache as fallback only
  event.respondWith(
    fetch(request).then(response => {
      if (response && response.ok && url.origin === self.location.origin) {
        caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      }
      return response;
    }).catch(() => caches.match(request))
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
