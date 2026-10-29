'use client';

import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { downloadCsv } from '@/utils/exportCsv';
import { toCsvRows } from '@/lib/exportRows';

// Botón estándar de exportación (CSV que Excel abre) para las pantallas
// contables. Recibe lo que la pantalla ya tiene en memoria.
export default function ExportCsvButton({ data, filename, label = 'Exportar Excel' }) {
  const rows = toCsvRows(data);
  if (!rows.length) return null;
  return (
    <button
      type="button"
      onClick={() => downloadCsv(filename, rows)}
      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-orange-600"
    >
      <ArrowDownTrayIcon className="h-4 w-4" /> {label}
    </button>
  );
}
