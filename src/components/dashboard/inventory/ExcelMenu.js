'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  ChevronDownIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';

// Un solo botón "Excel" con dos opciones: Importar (va a la página de carga
// masiva) y Exportar (descarga el inventario actual en .xlsx).
export default function ExcelMenu({ onExport, exporting = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const item =
    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600"
      >
        {exporting ? (
          <ArrowPathIcon className="h-4 w-4 animate-spin" />
        ) : (
          <TableCellsIcon className="h-4 w-4" />
        )}
        Excel
        <ChevronDownIcon
          className={`h-3.5 w-3.5 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
        >
          <Link
            href="/dashboard/inventory/import"
            role="menuitem"
            className={item}
            onClick={() => setOpen(false)}
          >
            <ArrowUpTrayIcon className="h-4 w-4" />
            Importar Excel
          </Link>
          <button
            type="button"
            role="menuitem"
            className={item}
            disabled={exporting}
            onClick={() => {
              setOpen(false);
              onExport?.();
            }}
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            {exporting ? 'Exportando…' : 'Exportar Excel'}
          </button>
        </div>
      )}
    </div>
  );
}
