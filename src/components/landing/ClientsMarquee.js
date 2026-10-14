'use client';

import { useEffect, useState } from 'react';

function apiBase() {
  let url = process.env.NEXT_PUBLIC_API_URL || '';
  if (!url || url.includes('localhost')) {
    url = 'https://admineuropeatvstoreback-production.up.railway.app';
  }
  return url.replace(/\/$/, '');
}

function initials(name) {
  return (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function ClientCircle({ c }) {
  return (
    <div className="flex w-32 flex-none flex-col items-center gap-2.5">
      <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-white shadow-sm">
        {c.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.logo}
            alt={c.name}
            loading="lazy"
            className="h-full w-full object-contain p-2"
          />
        ) : (
          <span className="text-2xl font-bold text-neutral-400">
            {initials(c.name)}
          </span>
        )}
      </div>
      <span className="line-clamp-2 w-full text-center text-xs font-semibold uppercase tracking-wide text-neutral-600">
        {c.name}
      </span>
    </div>
  );
}

// Slider automático (marquee) con los clientes registrados: logos en círculo,
// todos del mismo tamaño, moviéndose solos en bucle.
export default function ClientsMarquee() {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch(`${apiBase()}/public/clients`, {
          cache: 'no-store',
        });
        const json = await res.json();
        if (!cancel) setClients(json?.data || []);
      } catch {
        if (!cancel) setClients([]);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  if (!clients.length) return null;

  // Para que la tira SIEMPRE llene el ancho y el bucle sea continuo (sale por la
  // izquierda y reaparece por la derecha), se repite la lista hasta cubrir un
  // ancho mínimo; ese "grupo" se duplica y la animación lo corre -50%.
  const ITEM_W = 170; // ancho aprox. de cada cliente + separación (px)
  const reps = Math.max(2, Math.ceil(1600 / (clients.length * ITEM_W)));
  const group = Array.from({ length: reps }).flatMap(() => clients);
  const loop = [...group, ...group];
  const speed = Math.max(18, group.length * 3); // segundos por vuelta

  return (
    <section className="border-y border-neutral-100 bg-white py-14">
      <div className="mx-auto max-w-6xl px-5 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-orange-600">
          Confían en Pegazo
        </p>
        <h2 className="mt-2 text-2xl font-bold text-neutral-900">
          Negocios que ya usan Pegazo
        </h2>
      </div>

      <div
        className="group mt-10 overflow-hidden"
        style={{
          maskImage:
            'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)',
          WebkitMaskImage:
            'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)',
        }}
      >
        <div
          className="pg-marquee flex w-max gap-10"
          style={{ animationDuration: `${speed}s` }}
        >
          {loop.map((c, i) => (
            <ClientCircle key={`${c.id}-${i}`} c={c} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pgMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .pg-marquee { animation-name: pgMarquee; animation-timing-function: linear; animation-iteration-count: infinite; }
        .group:hover .pg-marquee { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .pg-marquee { animation: none; flex-wrap: wrap; justify-content: center; } }
      `}</style>
    </section>
  );
}
