const CACHE = 'garoa-v51';
const URLS = [
  '/',
  '/index.html',
  '/sobre-garoa.html',
  '/lista-de-espera.html',
  '/asesoria.html',
  '/talleres.html',
  '/calendario.html',
  '/newsletter.html',
  '/narciso.garoa.png',
  '/garoa-flower.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
