'use client';

import { useEffect } from 'react';

// Registra el service worker de Pegazo (necesario para que el navegador ofrezca
// "Instalar app" y para el respaldo sin conexión). No renderiza nada.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* si falla, la web sigue funcionando igual */
      });
    };
    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad, { once: true });
    return () => window.removeEventListener('load', onLoad);
  }, []);

  return null;
}
