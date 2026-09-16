'use client';

import { useEffect, useRef } from 'react';
import {
  beginBackgroundRefresh,
  endBackgroundRefresh,
} from '@/lib/liveRefresh';
import { subscribeRealtime } from '@/lib/realtime';

// ¿El usuario está escribiendo ahora mismo? Si es así, NO refrescamos (para no
// borrarle lo que está escribiendo). El refresco queda pendiente y se ejecuta en
// cuanto termine de editar.
function isUserEditing() {
  if (typeof document === 'undefined') return false;
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.isContentEditable) return true;
  return false;
}

// Mantiene los datos "en vivo" SIN sondeo ni recargas molestas:
//  - el backend AVISA por SSE cuando algo cambia de verdad (no cada X segundos),
//  - también refresca al volver el foco / la pestaña,
//  - y NUNCA refresca mientras el usuario escribe (lo aplaza hasta que termine).
// La firma se mantiene: `useLiveRefresh(fn)` funciona igual que antes en todas
// las páginas ya cableadas.
export default function useLiveRefresh(cb) {
  const ref = useRef(cb);
  ref.current = cb;

  useEffect(() => {
    let idleTimer = null;
    let debounce = null;
    let pending = false;

    const run = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      // Está escribiendo: aplazar hasta que termine.
      if (isUserEditing()) {
        pending = true;
        if (!idleTimer) {
          idleTimer = setInterval(() => {
            if (!isUserEditing()) {
              clearInterval(idleTimer);
              idleTimer = null;
              if (pending) {
                pending = false;
                run();
              }
            }
          }, 800);
        }
        return;
      }
      const fn = ref.current;
      if (!fn) return;
      // Marca refresco en segundo plano para que los loaders no parpadeen.
      beginBackgroundRefresh();
      try {
        await fn();
      } finally {
        setTimeout(endBackgroundRefresh, 300);
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') run();
    };

    // Evento del backend (SSE): agrupa ráfagas para no refrescar de más.
    const onEvent = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(run, 400);
    };

    window.addEventListener('focus', run);
    document.addEventListener('visibilitychange', onVisible);
    const unsub = subscribeRealtime(onEvent);

    return () => {
      window.removeEventListener('focus', run);
      document.removeEventListener('visibilitychange', onVisible);
      if (debounce) clearTimeout(debounce);
      if (idleTimer) clearInterval(idleTimer);
      unsub();
    };
  }, []);
}
