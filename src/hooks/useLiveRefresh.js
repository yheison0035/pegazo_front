'use client';

import { useEffect, useRef } from 'react';
import {
  beginBackgroundRefresh,
  endBackgroundRefresh,
} from '@/lib/liveRefresh';

// Mantiene los datos "en vivo" sin recargar la página: vuelve a ejecutar `cb`
//  - al volver el foco a la ventana,
//  - al volver a la pestaña (visibilitychange),
//  - cada `interval` ms mientras la pestaña está visible (por defecto 20s).
// Solo la pantalla montada consume esto (las rutas SPA se desmontan al salir),
// así que no sobrecarga el backend. Pasa interval=0 para desactivar el sondeo.
export default function useLiveRefresh(cb, { interval = 20000 } = {}) {
  const ref = useRef(cb);
  ref.current = cb;

  useEffect(() => {
    const run = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      const cb = ref.current;
      if (!cb) return;
      // Marca "refresco en segundo plano" mientras dura el fetch para que los
      // loaders no parpadeen (solo se ven en la carga inicial). Se mantiene un
      // pequeño margen tras terminar por si hay un setState de cola.
      beginBackgroundRefresh();
      try {
        await cb();
      } finally {
        setTimeout(endBackgroundRefresh, 300);
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') run();
    };
    window.addEventListener('focus', run);
    document.addEventListener('visibilitychange', onVisible);
    const timer = interval ? setInterval(run, interval) : null;
    return () => {
      window.removeEventListener('focus', run);
      document.removeEventListener('visibilitychange', onVisible);
      if (timer) clearInterval(timer);
    };
  }, [interval]);
}
