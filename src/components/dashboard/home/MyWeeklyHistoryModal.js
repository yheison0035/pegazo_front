'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { getMyWeeklyHistory } from '@/lib/api/routes/statistics';
import { formatCOP } from '@/lib/api/utils/utils';

// Historial de cortes por semana (domingo→sábado) del propio barbero.
export default function MyWeeklyHistoryModal({ onClose }) {
  const [weeks, setWeeks] = useState([]);
  const [conf, setConf] = useState(true);
  const [openWeek, setOpenWeek] = useState(0); // índice de la semana expandida
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getMyWeeklyHistory()
      .then((r) => {
        if (!alive) return;
        setWeeks((r?.data || []).slice().reverse()); // más reciente arriba
        setConf(r?.ratesConfigured !== false);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-4 text-white">
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="h-6 w-6" />
            <div>
              <h3 className="text-base font-bold leading-tight">
                Mis cortes por semana
              </h3>
              <p className="text-xs text-white/85">
                Domingo a sábado · lo que ganas en cortes
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

        <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-gray-400">Cargando…</p>
          ) : weeks.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              Aún no hay semanas registradas.
            </p>
          ) : !conf ? (
            <div className="rounded-xl bg-amber-500/10 p-4 text-center text-sm text-amber-700">
              Aún no tienes tu porcentaje configurado. Pídele al administrador
              que lo ajuste para ver lo que ganas.
            </div>
          ) : (
            <ul className="space-y-2">
              {weeks.map((w, i) => {
                const open = openWeek === i;
                return (
                  <li
                    key={i}
                    className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenWeek(open ? -1 : i)}
                      className="flex w-full items-center justify-between gap-2 p-3 text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-500">
                          {w.label}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {w.cuts} {w.cuts === 1 ? 'corte' : 'cortes'}
                        </p>
                      </div>
                      <span className="flex-none text-sm font-bold text-emerald-600">
                        {formatCOP(w.earnings)}
                      </span>
                    </button>
                    {open && w.services?.length > 0 && (
                      <ul className="divide-y divide-gray-50 border-t border-gray-100 bg-gray-50/60 px-3 py-1">
                        {w.services.map((s, j) => (
                          <li
                            key={j}
                            className="flex items-center justify-between gap-2 py-1.5 text-sm"
                          >
                            <span className="truncate text-gray-600">
                              {s.qty}× {s.name}
                            </span>
                            <span className="flex-none font-semibold text-gray-800">
                              {formatCOP(s.earn)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
