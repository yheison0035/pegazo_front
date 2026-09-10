'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/authContext';
import {
  isBackgroundRefreshing,
  subscribeBackgroundRefresh,
} from '@/lib/liveRefresh';

export default function LoadingOverlay({ show = false, text = 'Cargando...' }) {
  const auth = useAuth();
  const logo = auth?.usuario?.company?.logo || '/images/logo_pegazo_icon.png';

  // Durante un refresco en segundo plano (sondeo en vivo) NO mostramos el
  // overlay: los datos se actualizan solos, sin parpadeo. Solo se ve en la
  // carga inicial o en acciones explícitas del usuario.
  const [bg, setBg] = useState(false);
  useEffect(() => {
    setBg(isBackgroundRefreshing());
    return subscribeBackgroundRefresh(setBg);
  }, []);

  if (!show || bg) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-white/75 backdrop-blur-sm">
      <div className="relative flex h-20 w-20 items-center justify-center">
        {/* Anillo giratorio */}
        <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-orange-100 border-t-orange-500 [animation-duration:0.9s]" />

        {/* Logo de la empresa (con latido suave) */}
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-white shadow-md ring-1 ring-black/5 animate-pulse">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo}
            alt="Cargando"
            className="h-full w-full object-contain p-1.5"
          />
        </div>
      </div>

      <p className="mt-4 text-sm font-medium text-gray-600">{text}</p>
    </div>
  );
}
