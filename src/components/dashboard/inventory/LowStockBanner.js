'use client';

import { useEffect, useState } from 'react';
import {
  ExclamationTriangleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { getLowStock } from '@/lib/api/routes/inventory';
import LowStockModal from './LowStockModal';

// Barra de "inventario por agotarse" del módulo de inventario. Muestra el mismo
// resumen que el Inicio (agotados / por agotarse) y abre el MISMO modal de
// detalle. Se refresca cuando cambia `refreshKey` (p. ej. tras editar).
export default function LowStockBanner({ refreshKey }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);

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

  const agotados = items.filter((i) => (i.stock || 0) <= 0).length;
  const porAgotarse = items.length - agotados;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) =>
          (e.key === 'Enter' || e.key === ' ') && setOpen(true)
        }
        className="mb-4 flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition hover:shadow-md"
      >
        <div className="flex min-w-0 items-center gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 flex-none text-amber-500" />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {agotados > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                <b className="text-red-600">{agotados}</b>
                <span className="text-gray-600">
                  agotado{agotados === 1 ? '' : 's'}
                </span>
              </span>
            )}
            {porAgotarse > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                <b className="text-amber-600">{porAgotarse}</b>
                <span className="text-gray-600">por agotarse</span>
              </span>
            )}
          </div>
        </div>
        <span className="flex flex-none items-center gap-1 text-xs font-semibold text-amber-600">
          Ver detalle <ArrowRightIcon className="h-4 w-4" />
        </span>
      </div>

      {open && (
        <LowStockModal items={items} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
