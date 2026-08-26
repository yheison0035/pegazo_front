'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { getMyHistory } from '@/lib/api/routes/statistics';
import { formatCOP } from '@/lib/api/utils/utils';

// Historial del barbero por SEMANA o por MES, con su ganancia y el desglose de
// cortes y productos al desplegar.
export default function MyWeeklyHistoryModal({ onClose }) {
  const [group, setGroup] = useState('week'); // 'day' | 'week' | 'month'
  const [rows, setRows] = useState([]);
  const [conf, setConf] = useState(true);
  const [open, setOpen] = useState(0); // índice desplegado
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getMyHistory(group)
      .then((r) => {
        if (!alive) return;
        setRows((r?.data || []).slice().reverse()); // más reciente arriba
        setConf(r?.ratesConfigured !== false);
        setOpen(0);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [group]);

  const Tab = ({ value, children }) => (
    <button
      type="button"
      onClick={() => setGroup(value)}
      className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
        group === value
          ? 'bg-white text-orange-600 shadow-sm'
          : 'text-white/90 hover:text-white'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="h-6 w-6" />
              <div>
                <h3 className="text-base font-bold leading-tight">
                  Mi historial
                </h3>
                <p className="text-xs text-white/85">Lo que ganas</p>
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
            <Tab value="day">Por día</Tab>
            <Tab value="week">Por semana</Tab>
            <Tab value="month">Por mes</Tab>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-gray-400">Cargando…</p>
          ) : !conf ? (
            <div className="rounded-xl bg-amber-500/10 p-4 text-center text-sm text-amber-700">
              Aún no tienes tu porcentaje configurado. Pídele al administrador
              que lo ajuste para ver lo que ganas.
            </div>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              Aún no hay datos.
            </p>
          ) : (
            <ul className="space-y-2">
              {rows.map((w, i) => {
                const isOpen = open === i;
                return (
                  <li
                    key={i}
                    className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? -1 : i)}
                      className="flex w-full items-center justify-between gap-2 p-3 text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-500">
                          {w.label}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {w.cuts} cortes · {w.productUnits || 0} productos
                        </p>
                      </div>
                      <span className="flex-none text-sm font-bold text-emerald-600">
                        {formatCOP(w.earnings)}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="space-y-2 border-t border-gray-100 bg-gray-50/60 px-3 py-2">
                        {w.services?.length > 0 && (
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                              Cortes
                            </p>
                            <ul className="divide-y divide-gray-100">
                              {w.services.map((s, j) => (
                                <li
                                  key={j}
                                  className="flex items-center justify-between gap-2 py-1 text-sm"
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
                          </div>
                        )}
                        {w.products?.length > 0 && (
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                              Productos
                            </p>
                            <ul className="divide-y divide-gray-100">
                              {w.products.map((s, j) => (
                                <li
                                  key={j}
                                  className="flex items-center justify-between gap-2 py-1 text-sm"
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
                          </div>
                        )}
                        {!w.services?.length && !w.products?.length && (
                          <p className="py-1 text-center text-xs text-gray-400">
                            Sin ventas en este periodo.
                          </p>
                        )}
                      </div>
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
