'use client';

import { useCallback, useEffect, useState } from 'react';
import useLiveRefresh from '@/hooks/useLiveRefresh';
import {
  BookOpenIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { getJournal, getLedger } from '@/lib/api/routes/accounting';

function cop(n) {
  const v = Number(n) || 0;
  return v ? new Intl.NumberFormat('es-CO').format(v) : '—';
}
function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

const TYPE_BADGE = {
  VENTA: 'bg-emerald-50 text-emerald-600',
  COBRO: 'bg-teal-50 text-teal-600',
  GASTO: 'bg-red-50 text-red-600',
  MEMBRESIA: 'bg-emerald-50 text-emerald-600',
  DEVOLUCION: 'bg-amber-50 text-amber-600',
  DEPRECIACION: 'bg-gray-100 text-gray-500',
};
const TYPE_LABEL = {
  ASSET: 'Activo',
  LIABILITY: 'Pasivo',
  EQUITY: 'Patrimonio',
  INCOME: 'Ingresos',
  COST: 'Costos',
  EXPENSE: 'Gastos',
};

// Descarga un CSV que Excel abre bien (BOM + separador ;).
function downloadCSV(filename, rows) {
  const csv = rows
    .map((r) =>
      r
        .map((c) => {
          const s = String(c ?? '');
          return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(';'),
    )
    .join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function LibrosPage() {
  const [tab, setTab] = useState('journal'); // journal | ledger
  const [start, setStart] = useState(firstOfMonth());
  const [end, setEnd] = useState(today());
  const [journal, setJournal] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { startDate: start, endDate: end };
      if (tab === 'journal') {
        const res = await getJournal(params);
        setJournal(res?.data || null);
      } else {
        const res = await getLedger(params);
        setLedger(res?.data || null);
      }
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }, [tab, start, end]);

  useEffect(() => {
    load();
  }, [load]);

  useLiveRefresh(load);

  const exportJournal = () => {
    const rows = [['Fecha', 'Tipo', 'Referencia', 'Descripción', 'Cuenta', 'Nombre', 'Débito', 'Crédito']];
    (journal?.entries || []).forEach((e) => {
      e.lines.forEach((l) => {
        rows.push([e.date, e.type, e.ref, e.description, l.code, l.name, l.debit || '', l.credit || '']);
      });
    });
    downloadCSV(`libro-diario_${start}_a_${end}.csv`, rows);
  };
  const exportLedger = () => {
    const rows = [['Código', 'Cuenta', 'Grupo', 'Débito', 'Crédito', 'Saldo']];
    (ledger?.accounts || []).forEach((a) => {
      rows.push([a.code, a.name, TYPE_LABEL[a.type] || a.type || '', a.debit || '', a.credit || '', a.balance || '']);
    });
    downloadCSV(`libro-mayor_${start}_a_${end}.csv`, rows);
  };

  return (
    <RoleGuard allowedRoles={[Roles.SUPER_ADMIN, Roles.ADMIN, Roles.CONTADOR]}>
      <div className="relative mx-auto w-full max-w-5xl p-4">
        <LoadingOverlay show={loading} text="Cargando libros..." />

        <div className="mb-4">
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-800">
            <BookOpenIcon className="h-6 w-6 text-orange-500" /> Libros contables
          </h1>
          <p className="text-sm text-gray-500">
            Se arman solos con tus ventas, cobros, gastos, membresías,
            devoluciones y la depreciación. Elige el periodo y expórtalos.
          </p>
        </div>

        {/* Controles */}
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="flex rounded-xl bg-gray-100 p-1">
            {[
              ['journal', 'Libro diario'],
              ['ledger', 'Libro mayor'],
            ].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                  tab === k ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-500">
              Desde
            </label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-500">
              Hasta
            </label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
            />
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4" /> Actualizar
          </button>
          <button
            onClick={tab === 'journal' ? exportJournal : exportLedger}
            className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            <ArrowDownTrayIcon className="h-4 w-4" /> Exportar a Excel
          </button>
        </div>

        {/* LIBRO DIARIO */}
        {tab === 'journal' && (
          <div className="space-y-3">
            {(journal?.entries || []).length === 0 && !loading ? (
              <div className="rounded-2xl border border-dashed border-gray-200 py-14 text-center text-gray-400">
                No hay movimientos en este periodo.
              </div>
            ) : (
              (journal?.entries || []).map((e, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-gray-50 bg-gray-50/50 px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-500">{e.date}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          TYPE_BADGE[e.type] || 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {e.type}
                      </span>
                      <span className="text-xs text-gray-600">{e.description}</span>
                    </div>
                  </div>
                  <table className="min-w-full text-sm">
                    <tbody>
                      {e.lines.map((l, j) => (
                        <tr key={j} className="border-t border-gray-50">
                          <td className="w-16 px-4 py-1.5 font-mono text-xs text-gray-400">
                            {l.code}
                          </td>
                          <td className="px-2 py-1.5 text-gray-700">{l.name}</td>
                          <td className="w-32 px-4 py-1.5 text-right tabular-nums text-gray-700">
                            {l.debit ? cop(l.debit) : ''}
                          </td>
                          <td className="w-32 px-4 py-1.5 text-right tabular-nums text-gray-700">
                            {l.credit ? cop(l.credit) : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
            {journal?.totals && (journal?.entries || []).length > 0 && (
              <div className="flex justify-end gap-8 rounded-2xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white">
                <span>Débitos: {cop(journal.totals.debit)}</span>
                <span>Créditos: {cop(journal.totals.credit)}</span>
              </div>
            )}
          </div>
        )}

        {/* LIBRO MAYOR */}
        {tab === 'ledger' && (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Cuenta</th>
                  <th className="px-4 py-3">Grupo</th>
                  <th className="px-4 py-3 text-right">Débito</th>
                  <th className="px-4 py-3 text-right">Crédito</th>
                  <th className="px-4 py-3 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(ledger?.accounts || []).map((a) => (
                  <tr key={a.code} className="text-gray-700">
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs text-gray-400">{a.code}</span>{' '}
                      <span className="font-medium text-gray-800">{a.name}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-400">
                      {TYPE_LABEL[a.type] || a.type || ''}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {a.debit ? cop(a.debit) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {a.credit ? cop(a.credit) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-gray-900">
                      {cop(a.balance)}
                    </td>
                  </tr>
                ))}
                {(ledger?.accounts || []).length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-14 text-center text-gray-400">
                      No hay movimientos en este periodo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
