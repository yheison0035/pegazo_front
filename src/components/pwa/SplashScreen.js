'use client';

import { useEffect, useState } from 'react';

// Pantalla de bienvenida: cubre el "blanco" mientras la app termina de cargar
// (sobre todo en la PWA al abrir). Se muestra al instante y se desvanece sola
// en cuanto la app queda lista. Vive en el layout raíz, así que solo aparece en
// el arranque en frío, no en cada navegación.
export default function SplashScreen() {
  const [phase, setPhase] = useState('show'); // 'show' -> 'fade' -> 'gone'

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fade'), 350);
    const t2 = setTimeout(() => setPhase('gone'), 900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === 'gone') return null;

  return (
    <div
      id="pegazo-splash"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '22px',
        opacity: phase === 'fade' ? 0 : 1,
        transition: 'opacity 0.5s ease',
        pointerEvents: 'none',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/icon-192.png"
        alt="Pegazo"
        width={104}
        height={104}
        style={{ borderRadius: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
      />
      <span className="pegazo-splash-spinner" />
    </div>
  );
}
