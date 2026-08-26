'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  XMarkIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { getMyAppointments } from '@/lib/api/routes/appointments';

const RANGES = [
  { value: 'today', label: 'Hoy' },
  { value: 'tomorrow', label: 'Mañana' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
];

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

// Fecha 'YYYY-MM-DD' → 'lun 25/08' (para semana/mes, donde varias fechas se
// mezclan). Se evita new Date(str) por desfases de zona.
function shortDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
  return `${DIAS[wd]} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

// Mis citas del barbero por rango: hoy / mañana / semana / mes.
export default function TodayAppointmentsModal({ onClose, initialRange = 'today' }) {
  const [range, setRange] = useState(initialRange);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getMyAppointments(range)
      .then((r) => {
        if (alive) setItems(r?.data || []);
      })
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [range]);

  const showDate = range === 'week' || range === 'month';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="h-6 w-6" />
              <div>
                <h3 className="text-base font-bold leading-tight">Mis citas</h3>
                <p className="text-xs text-white/85">
                  {loading
                    ? 'Cargando…'
                    : `${items.length} ${items.length === 1 ? 'cita' : 'citas'}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-white/80 hover:bg-white/15 hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-3 inline-flex rounded-lg bg-white/15 p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRange(r.value)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  range === r.value
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-white/90 hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-gray-400">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              No tienes citas en este periodo.
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-gray-800">
                      {showDate && (
                        <span className="mr-1.5 font-medium text-gray-400">
                          {shortDate(a.date)}
                        </span>
                      )}
                      {a.startTime || '—'}
                    </span>
                    {a.status && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                        {a.status}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-gray-700">
                    {a.customer?.name || 'Cliente'}
                  </p>
                  {a.service?.name && (
                    <p className="text-xs text-gray-400">{a.service.name}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-gray-100 px-5 py-3 text-right">
          <Link
            href="/dashboard/appointments"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-lg bg-gray-800 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-700"
          >
            Ver todas mis citas <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
