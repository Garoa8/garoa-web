const CACHE = 'garoa-v84';
const URLS = [
  '/',
  '/index.html',
  '/sobre-garoa.html',
  '/test-barrera.html',
  '/lista-de-espera.html',
  '/asesoria.html',
  '/talleres.html',
  '/calendario.html',
  '/newsletter.html',
  '/tienda.html',
  '/contacto.html',
  '/narciso.garoa.png',
  '/narciso.garoa.cream.png',
  '/garoa-flower.png',
  '/hero-tonico.jpg',
  '/editorial-1.jpg',
  '/editorial-2.jpg',
  '/editorial-3.jpg',
  '/editorial-4.jpg',
  '/editorial-5.jpg',
  '/editorial-6.jpg',
  '/sarai-cepillos-taller.jpg'
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
