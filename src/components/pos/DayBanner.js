'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ExclamationTriangleIcon,
  CalculatorIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/authContext';
import { getCurrentCash } from '@/lib/api/routes/cash';
import { getLocals } from '@/lib/api/routes/locals';
import { dayStateFromRegister } from '@/lib/dayStatus';

// Aviso arriba del panel cuando la empresa exige abrir el día y aún no está
// abierto (o el día anterior quedó sin cerrar). Aparece para TODOS los roles:
// si el usuario no tiene sede asignada (p.ej. el dueño/admin), se toma la
// primera sede para saber el estado del día.
export default function DayBanner() {
  const { usuario } = useAuth();
  const require = !!usuario?.company?.requireCashOpen;
  const [localId, setLocalId] = useState(usuario?.localId || null);
  const [state, setState] = useState('ok');

  // Resolver la sede: la del usuario o, si no tiene, la primera de la empresa.
  useEffect(() => {
    if (!require || usuario?.localId) return;
    let active = true;
    getLocals({ all: true })
      .then((r) => {
        const first = r?.data?.[0]?.id;
        if (active && first) setLocalId(first);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [require, usuario?.localId]);

  useEffect(() => {
    if (!require || !localId) return;
    let active = true;
    (async () => {
      try {
        const res = await getCurrentCash(localId);
        if (active) setState(dayStateFromRegister(res?.data));
      } catch (_) {
        if (active) setState('not_open');
      }
    })();
    return () => {
      active = false;
    };
  }, [require, localId]);

  if (!require || !localId || state === 'ok' || state === 'loading') return null;

  const prev = state === 'prev_day';
  return (
    <Link
      href="/dashboard/cash"
      className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 hover:bg-amber-100 transition"
    >
      <span className="flex items-center gap-2 font-medium">
        <ExclamationTriangleIcon className="h-5 w-5 flex-none text-amber-500" />
        {prev
          ? 'El día anterior no se ha cerrado. No podrás vender hasta cerrarlo.'
          : 'El día no está abierto. No podrás vender hasta abrirlo.'}
      </span>
      <span className="flex-none inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
        <CalculatorIcon className="h-4 w-4" />
        {prev ? 'Cerrar el día' : 'Abrir el día'}
      </span>
    </Link>
  );
}
