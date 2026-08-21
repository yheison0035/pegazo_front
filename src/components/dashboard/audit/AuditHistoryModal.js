'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { getAuditHistory } from '@/lib/api/routes/audit';
import { formatCOP, formatDateTime } from '@/lib/api/utils/utils';
import {
  ACTION_LABEL,
  ACTION_COLOR,
  FIELD_LABELS,
} from '@/components/dashboard/tables/segments/contentData/lastAudit';

const ACTION_BADGE = {
  CREATE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  UPDATE: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  DELETE: 'bg-red-50 text-red-700 ring-red-600/20',
};

const MONEY_FIELDS = new Set([
  'amount',
  'salePrice',
  'purchasePrice',
  'oldPrice',
  'totalAmount',
  'price',
  'discount',
  'subtotal',
]);
const DATE_FIELDS = new Set(['expenseDate', 'date', 'saleDate', 'createdAt']);

// Formatea un valor de campo para mostrarlo legible en el detalle.
function formatValue(field, value) {
  if (value === null || value === undefined || value === '')
    return '(vacío)';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (MONEY_FIELDS.has(field)) return formatCOP(value);
  if (DATE_FIELDS.has(field)) {
    const d = formatDateTime(value);
    return d || String(value);
  }
  return String(value);
}

// Normaliza la entrada de cambios a { field, before, after }[].
function toRows(changes) {
  if (!changes || typeof changes !== 'object') return [];
  return Object.entries(changes).map(([field, v]) => ({
    field,
    label: FIELD_LABELS[field] || field,
    before: v?.before,
    after: v?.after,
  }));
}

export default function AuditHistoryModal({ entity, id, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getAuditHistory(entity, id);
        if (!alive) return;
        setLogs(res?.data || []);
      } catch (e) {
        if (alive) setError(e?.message || 'No se pudo cargar el historial');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [entity, id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between bg-gradient-to-r from-orange-600 to-[#111827] px-6 py-4 text-white">
          <div>
            <h2 className="text-lg font-bold">Historial de cambios</h2>
            <p className="text-xs opacity-80">
              Todo lo que se ha creado o editado en este registro.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 transition hover:bg-white/10"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <p className="py-8 text-center text-sm text-gray-400">
              Cargando historial…
            </p>
          )}

          {!loading && error && (
            <p className="py-8 text-center text-sm text-red-500">{error}</p>
          )}

          {!loading && !error && logs.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">
              Este registro no tiene historial de cambios.
            </p>
          )}

          {!loading && !error && logs.length > 0 && (
            <ol className="relative space-y-5 border-l border-gray-200 pl-6">
              {logs.map((log) => {
                const rows = toRows(log.changes);
                const label = ACTION_LABEL[log.action] || log.action;
                const color = ACTION_COLOR[log.action] || 'text-gray-600';
                return (
                  <li key={log.id} className="relative">
                    {/* Punto en la línea de tiempo */}
                    <span
                      className={`absolute -left-[29px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${
                        log.action === 'CREATE'
                          ? 'bg-emerald-500'
                          : log.action === 'DELETE'
                            ? 'bg-red-500'
                            : 'bg-orange-500'
                      }`}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          ACTION_BADGE[log.action] ||
                          'bg-gray-100 text-gray-600 ring-gray-500/20'
                        }`}
                      >
                        {label}
                      </span>
                      <span className="text-sm font-medium text-gray-800">
                        {log.userName || 'Sistema'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>

                    {rows.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        <p className="text-xs text-gray-500">
                          {rows.length === 1
                            ? 'Se modificó 1 dato:'
                            : `Se modificaron ${rows.length} datos:`}
                        </p>
                        <ul className="space-y-2">
                          {rows.map((r) => (
                            <li
                              key={r.field}
                              className="rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2"
                            >
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                {r.label}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                                <span className="rounded-md bg-white px-2 py-0.5 text-gray-400 line-through ring-1 ring-gray-200">
                                  {formatValue(r.field, r.before)}
                                </span>
                                <ArrowRightIcon className="h-4 w-4 flex-none text-orange-500" />
                                <span className="rounded-md bg-white px-2 py-0.5 font-semibold text-gray-900 ring-1 ring-orange-200">
                                  {formatValue(r.field, r.after)}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500">
                        {log.action === 'CREATE'
                          ? 'Se creó el registro por primera vez.'
                          : log.action === 'DELETE'
                            ? 'Se eliminó el registro.'
                            : 'Sin cambios de campos registrados.'}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
