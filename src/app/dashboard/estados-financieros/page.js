'use client';

import { useCallback, useEffect, useState } from 'react';
import useLiveRefresh from '@/hooks/useLiveRefresh';
import {
  ChartPieIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { getFinancials } from '@/lib/api/routes/accounting';

function cop(n) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
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

// Fila de detalle (cuenta + valor).
function Line({ label, value, strong, indent }) {
  return (
    <div
      className={`flex items-center justify-between py-1.5 ${
        indent ? 'pl-3' : ''
      } ${strong ? 'font-bold text-gray-900' : 'text-gray-600'}`}
    >
      <span className="text-sm">{label}</span>
      <span className="text-sm tabular-nums">{cop(value)}</span>
    </div>
  );
}
function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function EstadosFinancierosPage() {
  const [tab, setTab] = useState('pyg'); // pyg | balance | flujo
  const [start, setStart] = useState(firstOfMonth());
  const [end, setEnd] = useState(today());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFinancials({ startDate: start, endDate: end });
      setData(res?.data || null);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  useEffect(() => {
    load();
  }, [load]);

  useLiveRefresh(load);

  const pyg = data?.incomeStatement;
  const bal = data?.balanceSheet;
  const flujo = data?.cashFlow;

  const exportCurrent = () => {
    if (tab === 'pyg' && pyg) {
      const r = [['ESTADO DE RESULTADOS', `${start} a ${end}`], []];
      r.push(['Ingresos', '']);
      pyg.income.forEach((a) => r.push([`  ${a.code} ${a.name}`, a.value]));
      r.push(['Total ingresos', pyg.totalIncome]);
      if (pyg.costs.length) {
        r.push(['Costos', '']);
        pyg.costs.forEach((a) => r.push([`  ${a.code} ${a.name}`, a.value]));
        r.push(['Total costos', pyg.totalCosts]);
      }
      r.push(['Utilidad bruta', pyg.grossProfit]);
      r.push(['Gastos', '']);
      pyg.expenses.forEach((a) => r.push([`  ${a.code} ${a.name}`, a.value]));
      r.push(['Total gastos', pyg.totalExpenses]);
      r.push(['UTILIDAD NETA', pyg.netProfit]);
      downloadCSV(`estado-resultados_${start}_a_${end}.csv`, r);
    } else if (tab === 'balance' && bal) {
      const r = [['BALANCE GENERAL', `al ${end}`], []];
      r.push(['Activos', '']);
      bal.assets.forEach((a) => r.push([`  ${a.code} ${a.name}`, a.value]));
      r.push(['Total activos', bal.totalAssets], []);
      r.push(['Pasivos', '']);
      bal.liabilities.forEach((a) => r.push([`  ${a.code} ${a.name}`, a.value]));
      r.push(['Total pasivos', bal.totalLiabilities], []);
      r.push(['Patrimonio', '']);
      bal.equity.forEach((a) => r.push([`  ${a.code} ${a.name}`, a.value]));
      r.push(['  Resultado del ejercicio', bal.retainedResult]);
      r.push(['Total patrimonio', bal.totalEquity]);
      r.push(['TOTAL PASIVO + PATRIMONIO', bal.totalLiabilities + bal.totalEquity]);
      downloadCSV(`balance-general_${end}.csv`, r);
    } else if (tab === 'flujo' && flujo) {
      const r = [['FLUJO DE CAJA', `${start} a ${end}`], []];
      flujo.accounts.forEach((a) =>
        r.push([`${a.code} ${a.name}`, 'Entradas', a.in, 'Salidas', a.out, 'Neto', a.net]),
      );
      r.push([], ['Total entradas', flujo.totalIn]);
      r.push(['Total salidas', flujo.totalOut]);
      r.push(['FLUJO NETO', flujo.net]);
      downloadCSV(`flujo-caja_${start}_a_${end}.csv`, r);
    }
  };

  return (
    <RoleGuard allowedRoles={[Roles.SUPER_ADMIN, Roles.ADMIN]}>
      <div className="relative mx-auto w-full max-w-3xl p-4">
        <LoadingOverlay show={loading} text="Calculando..." />

        <div className="mb-4">
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-800">
            <ChartPieIcon className="h-6 w-6 text-orange-500" /> Estados
            financieros
          </h1>
          <p className="text-sm text-gray-500">
            Se calculan solos con tu contabilidad. El balance es al corte; el
            estado de resultados y el flujo, del periodo elegido.
          </p>
        </div>

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="flex rounded-xl bg-gray-100 p-1">
            {[
              ['pyg', 'Estado de resultados'],
              ['balance', 'Balance general'],
              ['flujo', 'Flujo de caja'],
            ].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
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
            onClick={exportCurrent}
            className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            <ArrowDownTrayIcon className="h-4 w-4" /> Exportar
          </button>
        </div>

        {/* ESTADO DE RESULTADOS */}
        {tab === 'pyg' && pyg && (
          <div className="space-y-3">
            <Section title="Ingresos">
              {pyg.income.length ? (
                pyg.income.map((a) => (
                  <Line key={a.code} label={`${a.code} · ${a.name}`} value={a.value} indent />
                ))
              ) : (
                <p className="text-sm text-gray-400">Sin ingresos en el periodo.</p>
              )}
              <Line label="Total ingresos" value={pyg.totalIncome} strong />
            </Section>
            {pyg.costs.length > 0 && (
              <Section title="Costos">
                {pyg.costs.map((a) => (
                  <Line key={a.code} label={`${a.code} · ${a.name}`} value={a.value} indent />
                ))}
                <Line label="Total costos" value={pyg.totalCosts} strong />
              </Section>
            )}
            <div className="rounded-2xl bg-gray-50 px-5 py-3">
              <Line label="Utilidad bruta" value={pyg.grossProfit} strong />
            </div>
            <Section title="Gastos">
              {pyg.expenses.length ? (
                pyg.expenses.map((a) => (
                  <Line key={a.code} label={`${a.code} · ${a.name}`} value={a.value} indent />
                ))
              ) : (
                <p className="text-sm text-gray-400">Sin gastos en el periodo.</p>
              )}
              <Line label="Total gastos" value={pyg.totalExpenses} strong />
            </Section>
            <div
              className={`rounded-2xl px-6 py-4 text-white ${
                pyg.netProfit >= 0 ? 'bg-emerald-600' : 'bg-red-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-wide">
                  {pyg.netProfit >= 0 ? 'Utilidad neta' : 'Pérdida neta'}
                </span>
                <span className="text-xl font-bold tabular-nums">
                  {cop(pyg.netProfit)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* BALANCE GENERAL */}
        {tab === 'balance' && bal && (
          <div className="space-y-3">
            <Section title="Activos">
              {bal.assets.map((a) => (
                <Line key={a.code} label={`${a.code} · ${a.name}`} value={a.value} indent />
              ))}
              <Line label="Total activos" value={bal.totalAssets} strong />
            </Section>
            <Section title="Pasivos">
              {bal.liabilities.length ? (
                bal.liabilities.map((a) => (
                  <Line key={a.code} label={`${a.code} · ${a.name}`} value={a.value} indent />
                ))
              ) : (
                <p className="text-sm text-gray-400">Sin pasivos.</p>
              )}
              <Line label="Total pasivos" value={bal.totalLiabilities} strong />
            </Section>
            <Section title="Patrimonio">
              {bal.equity.map((a) => (
                <Line key={a.code} label={`${a.code} · ${a.name}`} value={a.value} indent />
              ))}
              <Line label="Resultado del ejercicio" value={bal.retainedResult} indent />
              <Line label="Total patrimonio" value={bal.totalEquity} strong />
            </Section>
            <div className="rounded-2xl bg-gray-900 px-6 py-3 text-white">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Pasivo + Patrimonio</span>
                <span className="text-lg font-bold tabular-nums">
                  {cop(bal.totalLiabilities + bal.totalEquity)}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-white/60">
                {bal.balanced
                  ? '✓ Cuadra con el total de activos'
                  : '⚠ Descuadre — revisar'}
              </p>
            </div>
          </div>
        )}

        {/* FLUJO DE CAJA */}
        {tab === 'flujo' && flujo && (
          <div className="space-y-3">
            <Section title="Movimiento de efectivo del periodo">
              {flujo.accounts.map((a) => (
                <div
                  key={a.code}
                  className="flex items-center justify-between border-b border-gray-50 py-2 last:border-0"
                >
                  <span className="text-sm text-gray-700">
                    {a.code} · {a.name}
                  </span>
                  <span className="flex gap-4 text-sm tabular-nums">
                    <span className="text-emerald-600">+{cop(a.in)}</span>
                    <span className="text-red-500">−{cop(a.out)}</span>
                    <span className="w-28 text-right font-semibold text-gray-900">
                      {cop(a.net)}
                    </span>
                  </span>
                </div>
              ))}
            </Section>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm">
                <p className="text-[10px] font-semibold uppercase text-gray-400">Entradas</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-emerald-600">
                  {cop(flujo.totalIn)}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm">
                <p className="text-[10px] font-semibold uppercase text-gray-400">Salidas</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-red-500">
                  {cop(flujo.totalOut)}
                </p>
              </div>
              <div
                className={`rounded-2xl p-4 text-center text-white shadow-sm ${
                  flujo.net >= 0 ? 'bg-emerald-600' : 'bg-red-600'
                }`}
              >
                <p className="text-[10px] font-semibold uppercase text-white/80">
                  Flujo neto
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums">{cop(flujo.net)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
