'use client';

import { useEffect, useState } from 'react';
import { getLocals } from '@/lib/api/routes/locals';

// Desplegable para que el DUEÑO elija la sede que quiere ver. Carga los locales
// accesibles (el backend ya los filtra según el rol): si el usuario solo tiene
// una sede (un empleado), NO se muestra —ese usuario siempre ve su local—.
// Valor vacío = "todas las sedes" (el dueño las ve juntas).
export default function LocalFilter({
  value,
  onChange,
  className = '',
  allLabel = 'Todas las sedes',
}) {
  const [locals, setLocals] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await getLocals({ all: true });
        if (alive) setLocals(r?.data || []);
      } catch (_) {
        /* sin locales: no se muestra el selector */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Con una sola sede (o ninguna) no hay nada que elegir.
  if (locals.length <= 1) return null;

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Filtrar por sede"
      className={
        className ||
        'rounded-xl border border-gray-200 px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500'
      }
    >
      <option value="">{allLabel}</option>
      {locals.map((l) => (
        <option key={l.id} value={l.id}>
          {l.name}
        </option>
      ))}
    </select>
  );
}
