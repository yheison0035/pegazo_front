'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { getMyWeeklyHistory } from '@/lib/api/routes/statistics';
import { formatCOP } from '@/lib/api/utils/utils';

// Historial de cortes por semana (domingo→sábado) del propio barbero.
export default function MyWeeklyHistoryModal({ onClose }) {
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getMyWeeklyHistory()
      .then((r) => {
        if (alive) setWeeks((r?.data || []).slice().reverse()); // más reciente arriba
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const max = weeks.reduce((mx, w) => Math.max(mx, w.total || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-4 text-white">
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="h-6 w-6" />
            <div>
              <h3 className="text-base font-bold leading-tight">
                Mi historial por semana
              </h3>
              <p className="text-xs text-white/85">Domingo a sábado</p>
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
          ) : (
            <ul className="space-y-2">
              {weeks.map((w, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-gray-500">
                      {w.label}
                    </span>
                    <span className="text-sm font-bold text-emerald-600">
                      {formatCOP(w.total)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-orange-500"
                      style={{
                        width: `${max > 0 ? ((w.total || 0) / max) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">
                    {w.count} {w.count === 1 ? 'atención' : 'atenciones'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
