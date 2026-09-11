'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export default function ContadorLayout({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const sessionType = localStorage.getItem('sessionType');
    if (!token || sessionType !== 'accountant') {
      router.replace('/login');
      return;
    }
    try {
      const c = JSON.parse(localStorage.getItem('contador') || '{}');
      setName(c?.name || 'Contador');
    } catch {
      /* noop */
    }
    setReady(true);
  }, [router]);

  const logout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('sessionType');
      localStorage.removeItem('contador');
      localStorage.removeItem('usuario');
    } catch {
      /* noop */
    }
    router.push('/login');
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-400">
        Cargando…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-orange-500/10 bg-gradient-to-r from-[#0b0f19] to-[#05070d] shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <img
              src="/images/logo_pegazo.png"
              alt="Pegazo"
              className="h-7 w-auto flex-none sm:h-8"
            />
            <span className="flex-none rounded-full bg-orange-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-orange-300">
              Contador
            </span>
          </div>
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden truncate text-sm text-white/70 sm:inline">
              {name}
            </span>
            <button
              onClick={logout}
              className="inline-flex flex-none items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" /> Salir
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
