// Service worker: guarda o app no aparelho para abrir rápido e funcionar com sinal fraco.
// IMPORTANTE: ao publicar uma nova versão, troque o número em CACHE.

const CACHE = 'pegando-o-beco-v3';
const TILES_CACHE = CACHE + '-tiles';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',

  './css/base.css',
  './css/map.css',
  './css/splash.css',
  './css/search.css',
  './css/preview.css',
  './css/navigation.css',
  './css/dialogs.css',

  './js/main.js',
  './js/config.js',
  './js/state.js',
  './js/dom.js',
  './js/geo.js',
  './js/format.js',
  './js/maneuvers.js',
  './js/voice.js',
  './js/api.js',
  './js/mapView.js',
  './js/route.js',
  './js/search.js',
  './js/preview.js',
  './js/simulation.js',
  './js/wakeLock.js',
  './js/options.js',
  './js/navigation.js',
  './js/gps.js',
  './js/splash.js',

  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js',
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

// Apaga caches de versões antigas
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== TILES_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  // Rotas e buscas: sempre da internet, nunca do cache
  if (/project-osrm|komoot/.test(url.host)) return;

  // Mapa: usa o cache primeiro e atualiza em segundo plano
  if (/openfreemap/.test(url.host)) {
    e.respondWith(caches.open(TILES_CACHE).then(async cache => {
      const hit = await cache.match(e.request);
      const network = fetch(e.request)
        .then(res => { if (res.ok) cache.put(e.request, res.clone()); return res; })
        .catch(() => hit);
      return hit || network;
    }));
    return;
  }

  // Arquivos do app: internet primeiro, cache se estiver sem sinal
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok && (url.origin === location.origin || /unpkg/.test(url.host))) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
