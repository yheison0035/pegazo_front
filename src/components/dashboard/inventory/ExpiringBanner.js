'use client';

import { useEffect, useState } from 'react';
import {
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { getExpiring } from '@/lib/api/routes/inventory';
import { formatDateOnly } from '@/lib/api/utils/utils';

// Aviso de "productos por vencer" (droguería / perecederos). No aparece si el
// negocio no maneja fechas de vencimiento.
export default function ExpiringBanner({ refreshKey }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getExpiring();
        if (alive) setItems(res?.data || []);
      } catch {
        if (alive) setItems([]);
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  if (!loaded || items.length === 0) return null;

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-red-200 bg-red-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-red-800">
          <ClockIcon className="h-5 w-5 flex-none text-red-500" />
          {items.length}{' '}
          {items.length === 1 ? 'producto por vencer' : 'productos por vencer'}
        </span>
        {open ? (
          <ChevronUpIcon className="h-4 w-4 text-red-500" />
        ) : (
          <ChevronDownIcon className="h-4 w-4 text-red-500" />
        )}
      </button>

      {open && (
        <div className="border-t border-red-200 bg-white/60 px-4 py-2">
          <div className="flex flex-col divide-y divide-red-100">
            {items.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <span className="truncate font-medium text-gray-800">
                  {p.name}
                  {p.lot ? (
                    <span className="ml-1 text-xs text-gray-400">
                      lote {p.lot}
                    </span>
                  ) : null}
                </span>
                <span
                  className={`flex-none text-xs font-semibold ${
                    p.daysLeft <= 0 ? 'text-red-700' : 'text-red-500'
                  }`}
                >
                  {p.daysLeft <= 0
                    ? 'Vencido'
                    : `vence en ${p.daysLeft} d`}{' '}
                  · {formatDateOnly(p.expiryDate)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
