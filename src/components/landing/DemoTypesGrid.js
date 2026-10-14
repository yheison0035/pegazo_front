'use client';

import { useEffect, useState } from 'react';

// Resuelve la URL del API en el navegador (misma lógica que las páginas
// públicas). En producción cae a la URL del API si la env no llega.
function apiBase() {
  let url = process.env.NEXT_PUBLIC_API_URL || '';
  if (!url || url.includes('localhost')) {
    url = 'https://admineuropeatvstoreback-production.up.railway.app';
  }
  return url.replace(/\/$/, '');
}

// Demo en vivo por modo (los 3 que mantenemos). Cada tipo abre el de su modo.
const MODE = {
  booking: {
    label: 'Citas',
    emoji: '📅',
    href: 'https://pegazo.co/booking/ragnorbarber',
  },
  menu: {
    label: 'Menú',
    emoji: '🍽️',
    href: 'https://pegazo.co/menu/demorestaurante',
  },
  catalog: {
    label: 'Catálogo',
    emoji: '🛍️',
    href: 'https://pegazo.co/catalog/europeatvstore',
  },
};

// Emoji por tipo (si el tipo es nuevo y no está aquí, usa el del modo).
const TYPE_EMOJI = {
  RESTAURANTE: '🍽️',
  COMIDA_RAPIDA: '🍔',
  CAFETERIA: '☕',
  PIZZERIA: '🍕',
  PANADERIA: '🥐',
  BAR: '🍻',
  LICORERA: '🍷',
  CARNICERIA: '🥩',
  PESCADERIA: '🐟',
  FRUVER: '🥦',
  SUPERMERCADO: '🛒',
  TIENDA_ROPA: '👕',
  CALZADO: '👟',
  DROGUERIA: '💊',
  FERRETERIA: '🔧',
  FLORISTERIA: '🌸',
  PAPELERIA: '📎',
  PETSHOP: '🐶',
  VETERINARIA: '🐾',
  TECNOLOGIA: '💻',
  ECOMMERCE: '📦',
  COMERCIO: '🏪',
  DISTRIBUCION: '🚚',
  TELEVENTAS: '📞',
  FERIA: '🎪',
  GUARDA_CASCOS: '🪖',
  BARBERIA: '💈',
  PELUQUERIA: '✂️',
  SPA: '💆',
  GIMNASIO: '🏋️',
  ODONTOLOGIA: '🦷',
  VETERINARIA_SERVICIOS: '🐾',
  LAVANDERIA: '🧺',
  TALLER_MECANICO: '🔩',
  LAVADO_VEHICULOS: '🚗',
  CANCHAS_SINTETICAS: '⚽',
  SERVICIOS: '🛠️',
};

const BADGE = {
  booking: 'bg-violet-100 text-violet-700',
  menu: 'bg-amber-100 text-amber-700',
  catalog: 'bg-sky-100 text-sky-700',
};

export default function DemoTypesGrid() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch(`${apiBase()}/public/business-types`, {
          cache: 'no-store',
        });
        const json = await res.json();
        if (!cancel) setTypes(json?.data || []);
      } catch {
        if (!cancel) setTypes([]);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  if (loading) {
    return (
      <p className="mt-10 text-center text-sm text-neutral-400">
        Cargando tipos de negocio…
      </p>
    );
  }
  if (!types.length) return null;

  return (
    <div className="mt-12">
      <p className="text-center text-sm font-semibold uppercase tracking-wide text-neutral-400">
        Y según tu tipo de negocio
      </p>
      <p className="mx-auto mt-1 max-w-xl text-center text-sm text-neutral-500">
        Cada vertical abre el demo que le corresponde. Toca el tuyo para verlo en
        vivo.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {types.map((t) => {
          const mode = MODE[t.mode] || MODE.catalog;
          const emoji = TYPE_EMOJI[t.type] || mode.emoji;
          return (
            <a
              key={t.type}
              href={mode.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-1.5 rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-sm font-semibold leading-tight text-neutral-800">
                {t.label}
              </span>
              <span
                className={`mt-0.5 inline-block w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  BADGE[t.mode] || BADGE.catalog
                }`}
              >
                {mode.label}
              </span>
              <span className="mt-1 text-[11px] font-semibold text-orange-600 opacity-0 transition group-hover:opacity-100">
                Ver demo →
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
