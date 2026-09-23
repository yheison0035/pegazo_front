'use client';

import { useEffect } from 'react';

// Registra el service worker de Pegazo (instalación PWA + notificaciones push).
//
// IMPORTANTE: NO recargamos la página cuando el SW se actualiza. Este SW no
// cachea la app (los assets de Next ya llegan frescos en cada navegación), así
// que forzar una recarga al "tomar control" (controllerchange) era innecesario
// y provocaba un CICLO INFINITO de recarga (splash) en la PWA — sobre todo al
// volver desde otra app (foco → update → skipWaiting → controllerchange →
// reload → …). El SW se actualiza en segundo plano y la app sigue viva.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    let reg;
    (async () => {
      try {
        reg = await navigator.serviceWorker.register('/sw.js');
        reg.update().catch(() => {});
      } catch {
        /* la web sigue funcionando igual sin PWA */
      }
    })();

    // Al volver a la app, busca una versión nueva en segundo plano (SIN recargar).
    const onVisible = () => {
      if (document.visibilityState === 'visible' && reg) {
        reg.update().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  return null;
}
