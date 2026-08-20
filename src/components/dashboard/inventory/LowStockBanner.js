'use client';

import { useEffect, useState } from 'react';
import {
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { getLowStock } from '@/lib/api/routes/inventory';

// Aviso de "productos por agotarse": stock total <= alerta de stock mínimo.
// Se refresca cuando cambia `refreshKey` (p. ej. tras editar el inventario).
export default function LowStockBanner({ refreshKey }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getLowStock();
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
    <div className="mb-4 overflow-hidden rounded-xl border border-amber-200 bg-amber-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-amber-800">
          <ExclamationTriangleIcon className="h-5 w-5 flex-none text-amber-500" />
          {items.length}{' '}
          {items.length === 1
            ? 'producto por agotarse'
            : 'productos por agotarse'}
        </span>
        {open ? (
          <ChevronUpIcon className="h-4 w-4 text-amber-500" />
        ) : (
          <ChevronDownIcon className="h-4 w-4 text-amber-500" />
        )}
      </button>

      {open && (
        <div className="border-t border-amber-200 bg-white/60 px-4 py-2">
          <div className="flex flex-col divide-y divide-amber-100">
            {items.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <span className="truncate font-medium text-gray-800">
                  {p.name}
                  {p.local ? (
                    <span className="ml-1 text-xs text-gray-400">
                      · {p.local}
                    </span>
                  ) : null}
                </span>
                <span className="flex-none text-xs font-semibold text-red-600">
                  {p.stock} / mín {p.minStock}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
