'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUturnLeftIcon, EyeIcon } from '@heroicons/react/24/outline';
import { isImpersonating, exitImpersonation } from '@/lib/impersonation';
import { useAuth } from '@/context/authContext';

// Aviso persistente cuando la plataforma está "viendo como" una empresa.
export default function ImpersonationBanner() {
  const { usuario } = useAuth();
  const [on, setOn] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    setOn(isImpersonating());
  }, []);

  // Publica la ALTURA REAL del banner como variable CSS (--support-banner-h)
  // para que el layout, el botón hamburguesa y el menú lateral se desplacen
  // justo lo necesario — también cuando el banner se parte en dos líneas en
  // móviles estrechos. Al salir del modo soporte vuelve a 0.
  useEffect(() => {
    const root = document.documentElement;
    const reset = () => root.style.setProperty('--support-banner-h', '0px');
    if (!on) {
      reset();
      return reset;
    }
    const el = ref.current;
    if (!el) return reset;
    const apply = () =>
      root.style.setProperty('--support-banner-h', `${el.offsetHeight}px`);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener('resize', apply);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', apply);
      reset();
    };
  }, [on]);

  if (!on) return null;

  const back = () => {
    exitImpersonation();
    window.location.href = '/platform/companies';
  };

  return (
    <div
      ref={ref}
      className="fixed inset-x-0 top-0 z-[60] flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-400 px-4 py-2 text-sm font-medium text-amber-950 shadow"
    >
      <span className="flex items-center gap-1.5">
        <EyeIcon className="h-4 w-4" />
        Estás viendo como <b>{usuario?.company?.name || 'una empresa'}</b> (modo
        soporte).
      </span>
      <button
        onClick={back}
        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-950 px-3 py-1 text-xs font-semibold text-white hover:bg-black"
      >
        <ArrowUturnLeftIcon className="h-3.5 w-3.5" />
        Volver a plataforma
      </button>
    </div>
  );
}
