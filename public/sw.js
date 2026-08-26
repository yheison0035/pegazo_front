// Service worker mínimo de Pegazo: habilita la instalación como app (PWA) y da
// una pantalla "sin conexión" de respaldo. NO cachea datos del CRM (para no
// mostrar información vieja): las navegaciones van a la red y solo si no hay
// internet se muestra la página offline.
const CACHE = 'pegazo-v3';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  // Solo interceptamos navegaciones (abrir páginas). El resto va directo a la
  // red, así los datos siempre son frescos.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match(OFFLINE_URL)),
    );
  }
});
