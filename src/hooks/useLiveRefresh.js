'use client';

import { useEffect, useRef } from 'react';

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
    const run = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      ref.current?.();
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
