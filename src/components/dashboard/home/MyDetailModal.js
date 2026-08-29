'use client';

import { useEffect, useState } from 'react';
import {
  XMarkIcon,
  ScissorsIcon,
  ShoppingBagIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { getMyDetail } from '@/lib/api/routes/statistics';
import { formatCOP } from '@/lib/api/utils/utils';

const TITLES = { today: 'Hoy', week: 'Esta semana', month: 'Este mes' };

function BreakdownList({ title, icon: Icon, items, empty }) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
        <Icon className="h-4 w-4" />
        {title}
      </p>
      {items.length === 0 ? (
        <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-400">
          {empty}
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100">
          {items.map((it, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-1 truncate text-gray-700">
                <span className="font-semibold">{it.qty}×</span> {it.name}
                {it.courtesy && (
                  <span
                    className="group relative inline-flex flex-none cursor-help text-orange-500"
                    tabIndex={0}
                  >
                    <InformationCircleIcon className="h-4 w-4" />
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden w-52 -translate-x-1/2 rounded-lg bg-gray-900 px-2.5 py-1.5 text-[11px] font-normal leading-snug text-white group-hover:block group-focus:block">
                      Este corte se hizo pero quedó sin comisión (cortesía o
                      corte mal aplicado): lo realizaste, pero no suma a tu pago.
                    </span>
                  </span>
                )}
              </span>
              <span
                className={`flex-none font-semibold ${
                  it.courtesy ? 'text-gray-400' : 'text-emerald-600'
                }`}
              >
                {formatCOP(it.earn)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Detalle del barbero para un periodo: qué cortes y qué productos, con lo que
// gana en cada uno. period = 'today' | 'week' | 'month'.
export default function MyDetailModal({ period = 'today', onClose }) {
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getMyDetail(period)
      .then((r) => {
        if (alive) setD(r?.data || null);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [period]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 text-white">
          <div>
            <h3 className="text-base font-bold leading-tight">
              Mi detalle · {TITLES[period] || 'Hoy'}
            </h3>
            <p className="text-xs text-white/85">
              {d?.label ? d.label : 'Lo que ganas'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-white/80 hover:bg-white/15 hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-gray-400">Cargando…</p>
          ) : !d ? (
            <p className="py-8 text-center text-sm text-gray-400">
              No se pudo cargar.
            </p>
          ) : !d.ratesConfigured ? (
            <div className="rounded-xl bg-amber-500/10 p-4 text-center text-sm text-amber-700">
              Aún no tienes tu porcentaje configurado. Pídele al administrador
              que lo ajuste para ver lo que ganas.
            </div>
          ) : (
            <>
              <div className="rounded-xl bg-emerald-500/10 p-3 text-center">
                <p className="text-[11px] font-medium text-emerald-700">
                  Ganas en total
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCOP(d.earnings)}
                </p>
                <p className="text-[11px] text-gray-500">
                  {d.cuts} cortes ·{' '}
                  {d.productUnits || 0}{' '}
                  {(d.productUnits || 0) === 1 ? 'producto' : 'productos'}
                </p>
              </div>

              <BreakdownList
                title={`Cortes (${d.rates.service}%) · ${formatCOP(
                  d.serviceEarn,
                )}`}
                icon={ScissorsIcon}
                items={d.services}
                empty="Sin cortes en este periodo."
              />
              <BreakdownList
                title={`Productos (${d.rates.product}%) · ${formatCOP(
                  d.productEarn,
                )}`}
                icon={ShoppingBagIcon}
                items={d.products}
                empty="Sin productos en este periodo."
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
