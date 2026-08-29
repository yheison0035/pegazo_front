// Service worker mínimo de Pegazo: habilita la instalación como app (PWA) y da
// una pantalla "sin conexión" de respaldo. NO cachea datos del CRM (para no
// mostrar información vieja): las navegaciones van a la red y solo si no hay
// internet se muestra la página offline.
const CACHE = 'pegazo-v4';
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

// ================== NOTIFICACIONES PUSH ==================
// Muestra la notificación que envía el backend (citas al barbero,
// consignaciones al dueño, etc.).
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Pegazo', body: event.data && event.data.text() };
  }
  const title = data.title || 'Pegazo';
  const options = {
    body: data.body || '',
    icon: '/images/logo_pegazo_icon.png',
    badge: '/images/logo_pegazo_icon.png',
    tag: data.tag || undefined,
    renotify: !!data.tag,
    data: { url: data.url || '/dashboard' },
    vibrate: [80, 40, 80],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Al tocar la notificación: enfoca una pestaña abierta o abre la app en la URL.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/dashboard';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if ('focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
      }),
  );
});
