'use client';

import { useEffect } from 'react';

// Registra el service worker de Pegazo y mantiene la app instalada (PWA) al día:
// - Busca nuevas versiones cada vez que vuelves a la app (foco).
// - Cuando el nuevo service worker toma el control, recarga UNA vez para que
//   se vean los últimos cambios (sin tener que reinstalar).
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    let hadController = !!navigator.serviceWorker.controller;
    let refreshing = false;

    const onControllerChange = () => {
      // La primera vez que el SW toma control (sin uno previo) NO recargamos.
      if (!hadController) {
        hadController = true;
        return;
      }
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      onControllerChange,
    );

    let reg;
    const register = async () => {
      try {
        reg = await navigator.serviceWorker.register('/sw.js');
        reg.update().catch(() => {});
      } catch {
        /* la web sigue funcionando igual */
      }
    };
    register();

    // Al volver a la app (foreground), revisa si hay una versión nueva.
    const onVisible = () => {
      if (document.visibilityState === 'visible' && reg) {
        reg.update().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        onControllerChange,
      );
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return null;
}
