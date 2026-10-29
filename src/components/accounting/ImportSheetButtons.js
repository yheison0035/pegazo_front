'use client';

import { useState } from 'react';
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { downloadWorkbook, readSheetRows } from '@/lib/accounting/xlsxIO';

// Par de botones "Plantilla" + "Importar Excel" reutilizable en las pantallas
// contables (plan de cuentas, activos). Lee el archivo, lo normaliza con
// `toRows`, lo envía con `importRows` y muestra el resultado por fila.
export default function ImportSheetButtons({
  templateName,
  templateSheets,
  preferredSheets = [],
  toRows,
  importRows,
  onDone,
  onError,
  hint,
}) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const downloadTemplate = () => {
    const sheets = typeof templateSheets === 'function' ? templateSheets() : templateSheets;
    downloadWorkbook(sheets, templateName);
  };

  const onFile = async (file) => {
    if (!file) return;
    setImporting(true);
    setResult(null);
    try {
      const { rows: raw } = await readSheetRows(file, preferredSheets);
      const rows = toRows(raw);
      if (!rows.length) {
        onError?.('El archivo no tiene filas para importar.');
        return;
      }
      const res = await importRows(rows);
      setResult(res?.data || null);
      onDone?.();
    } catch (e) {
      onError?.(e?.message || 'No se pudo importar el archivo.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={downloadTemplate}
        title={hint || 'Descarga la plantilla de Excel'}
        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
      >
        <ArrowDownTrayIcon className="h-4 w-4" /> Plantilla
      </button>
      <label
        title={hint || 'Importa un archivo .xlsx o .csv'}
        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100"
      >
        <ArrowUpTrayIcon className="h-4 w-4" />
        {importing ? 'Importando…' : 'Importar Excel'}
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          disabled={importing}
          onChange={(e) => {
            onFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </label>
      {result && (
        <div className="basis-full rounded-2xl border border-gray-100 bg-white p-3 text-sm shadow-sm">
          <p className="font-semibold text-gray-800">
            Importación: {result.created} creada{result.created === 1 ? '' : 's'}
            {result.updated != null ? ` · ${result.updated} actualizada${result.updated === 1 ? '' : 's'}` : ''}
            {result.errors?.length ? ` · ${result.errors.length} con error` : ''} (de {result.total} fila{result.total === 1 ? '' : 's'})
          </p>
          {result.errors?.length > 0 && (
            <ul className="mt-1 max-h-32 space-y-0.5 overflow-y-auto text-xs text-red-600">
              {result.errors.slice(0, 50).map((er, i) => (
                <li key={i}>Fila {er.row}: {er.message}</li>
              ))}
            </ul>
          )}
          <button type="button" onClick={() => setResult(null)} className="mt-1 text-xs text-gray-400 hover:text-gray-600">
            Cerrar
          </button>
        </div>
      )}
    </>
  );
}
