// Service worker: guarda o jogo no aparelho para abrir rápido e funcionar offline.
const CACHE = 'ptc-v8';
const FILES = [
  './',
  'index.html',
  'css/style.css',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'audio/tema-cidade.mp3',
  'js/lib/phaser.min.js',
  'js/state.js',
  'js/music.js',
  'js/data/npcs.js',
  'js/data/missions.js',
  'js/data/puzzles.js',
  'js/puzzles/puzzles.js',
  'js/minigames/percurso.js',
  'js/minigames/tocar.js',
  'js/minigames/canos.js',
  'js/minigames/obra.js',
  'js/minigames/horta.js',
  'js/scenes/BootScene.js',
  'js/scenes/WorldScene.js',
  'js/main.js'
];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => { if (e.request.method === 'GET') e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request))); });
