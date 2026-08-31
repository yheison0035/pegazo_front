'use client';

import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  Tooltip,
} from 'recharts';
import {
  ChartCard,
  MoneyTooltip,
  formatMoney,
  formatShort,
  shortDate,
  truncate,
  COLORS,
  PALETTE,
} from './statsUI';

// Etiquetas legibles de los tipos de gasto.
export const EXPENSE_TYPE_LABELS = {
  ARRIENDO: 'Arriendo',
  SERVICIOS_PUBLICOS: 'Servicios públicos',
  EMPLEADOS: 'Empleados / nómina',
  TRANSPORTE: 'Transporte',
  PEDIDOS: 'Pedidos / mercancía',
  PLAN_CELULAR: 'Plan celular',
  PLAN_INTERNET: 'Plan internet',
  ASEO: 'Aseo',
  MANTENIMIENTO: 'Mantenimiento',
  PUBLICIDAD: 'Publicidad',
  IMPUESTOS: 'Impuestos',
  COMISIONES: 'Comisiones',
  OTROS: 'Otros',
};

function prettyMethod(m) {
  if (!m) return '—';
  return String(m)
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

const EMPTY = { concept: '', type: '', paidTo: '', method: '', local: '' };

export default function ExpensesDetail({ data }) {
  const [filters, setFilters] = useState(EMPTY);
  const [groupBy, setGroupBy] = useState('type'); // panel "Consumo por"
  const detail = data?.expensesDetail || [];
  const byType = data?.expensesByType || [];
  const hasLocals = data?.hasMultipleLocals;

  const setF = (k, v) => setFilters((f) => ({ ...f, [k]: v }));

  // Opciones únicas por columna (para los selects de filtro).
  const options = useMemo(() => {
    const uniq = (key) =>
      [...new Set(detail.map((e) => e[key]).filter(Boolean))].sort();
    return {
      type: [...new Set(detail.map((e) => e.type))],
      paidTo: uniq('paidTo'),
      method: uniq('paymentMethod'),
      local: uniq('local'),
    };
  }, [detail]);

  const filtered = useMemo(() => {
    const c = filters.concept.trim().toLowerCase();
    return detail
      .filter((e) => {
        if (c && !String(e.concept).toLowerCase().includes(c)) return false;
        if (filters.type && e.type !== filters.type) return false;
        if (filters.paidTo && (e.paidTo || '') !== filters.paidTo) return false;
        if (filters.method && (e.paymentMethod || '') !== filters.method)
          return false;
        if (filters.local && (e.local || '') !== filters.local) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [detail, filters]);

  const filteredTotal = useMemo(
    () => filtered.reduce((s, e) => s + e.amount, 0),
    [filtered],
  );

  // Agrupa por día para subtotales.
  const groups = useMemo(() => {
    const map = new Map();
    for (const e of filtered) {
      const key = String(e.date).slice(0, 10);
      if (!map.has(key)) map.set(key, { day: key, items: [], total: 0 });
      const g = map.get(key);
      g.items.push(e);
      g.total += e.amount;
    }
    return [...map.values()];
  }, [filtered]);

  // "Consumo por": suma del conjunto filtrado agrupado por la columna elegida.
  const consumption = useMemo(() => {
    const keyOf = (e) => {
      if (groupBy === 'type') return EXPENSE_TYPE_LABELS[e.type] || e.type;
      if (groupBy === 'method') return prettyMethod(e.paymentMethod);
      if (groupBy === 'paidTo') return e.paidTo || 'Sin especificar';
      if (groupBy === 'local') return e.local || '—';
      return 'Otros';
    };
    const map = new Map();
    for (const e of filtered) {
      const k = keyOf(e);
      map.set(k, (map.get(k) || 0) + e.amount);
    }
    return [...map.entries()]
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [filtered, groupBy]);

  const totalExpenses = data?.summary?.totalExpenses || 0;
  const anyFilter = JSON.stringify(filters) !== JSON.stringify(EMPTY);
  const colCount = hasLocals ? 6 : 5;

  const GROUP_TABS = [
    { id: 'type', label: 'Categoría' },
    { id: 'method', label: 'Método' },
    { id: 'paidTo', label: 'Pagado a' },
    ...(hasLocals ? [{ id: 'local', label: 'Sede' }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Resumen superior */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
            Total de gastos
          </p>
          <p className="mt-1 text-2xl font-extrabold text-orange-900">
            {formatMoney(totalExpenses)}
          </p>
          <p className="text-xs text-orange-700/70">
            {detail.length} movimiento(s) en el periodo
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Gasto promedio
          </p>
          <p className="mt-1 text-2xl font-extrabold text-gray-900">
            {formatMoney(detail.length ? totalExpenses / detail.length : 0)}
          </p>
          <p className="text-xs text-gray-400">por movimiento</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Categoría principal
          </p>
          <p className="mt-1 truncate text-2xl font-extrabold text-gray-900">
            {byType[0]
              ? EXPENSE_TYPE_LABELS[byType[0].type] || byType[0].type
              : '—'}
          </p>
          <p className="text-xs text-gray-400">
            {byType[0] ? formatMoney(byType[0].total) : 'Sin gastos'}
          </p>
        </div>
      </div>

      {/* Consumo por — cuánto se lleva cada uno */}
      <ChartCard
        title="Consumo por"
        subtitle="Cuánto se lleva cada uno (sobre lo filtrado abajo)"
      >
        <div className="mb-3 inline-flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-white p-0.5">
          {GROUP_TABS.map((g) => (
            <button
              key={g.id}
              onClick={() => setGroupBy(g.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                groupBy === g.id
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
        {consumption.length ? (
          <div className="space-y-1.5">
            {consumption.map((c) => {
              const pctv = filteredTotal
                ? Math.round((c.total / filteredTotal) * 100)
                : 0;
              return (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="w-40 shrink-0 truncate text-sm text-gray-700">
                    {c.name}
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-orange-400"
                      style={{ width: `${pctv}%` }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right text-xs text-gray-400">
                    {pctv}%
                  </span>
                  <span className="w-28 shrink-0 text-right text-sm font-semibold text-gray-900">
                    {formatMoney(c.total)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-gray-400">Sin datos</p>
        )}
      </ChartCard>

      {/* Detalle con filtros por columna */}
      <ChartCard
        title="Detalle de gastos"
        subtitle="Filtra por cada columna para ver el total de ese grupo"
      >
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span className="text-sm text-gray-500">
            {filtered.length} de {detail.length} movimiento(s) ·{' '}
            <span className="font-semibold text-gray-800">
              {formatMoney(filteredTotal)}
            </span>
          </span>
          {anyFilter && (
            <button
              onClick={() => setFilters(EMPTY)}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {detail.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-2 pr-4">Fecha de pago</th>
                  <th className="py-2 pr-4">Concepto</th>
                  <th className="py-2 pr-4">Categoría</th>
                  <th className="py-2 pr-4">Pagado a</th>
                  <th className="py-2 pr-4">Método</th>
                  {hasLocals && <th className="py-2 pr-4">Sede</th>}
                  <th className="py-2 pl-4 text-right">Monto</th>
                </tr>
                {/* Fila de filtros por columna */}
                <tr className="border-b border-gray-100 align-top">
                  <th className="py-2 pr-2" />
                  <th className="py-2 pr-2">
                    <input
                      value={filters.concept}
                      onChange={(e) => setF('concept', e.target.value)}
                      placeholder="Buscar…"
                      className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs font-normal normal-case focus:border-orange-400 focus:outline-none"
                    />
                  </th>
                  <th className="py-2 pr-2">
                    <ColSelect
                      value={filters.type}
                      onChange={(v) => setF('type', v)}
                      options={options.type.map((t) => ({
                        value: t,
                        label: EXPENSE_TYPE_LABELS[t] || t,
                      }))}
                    />
                  </th>
                  <th className="py-2 pr-2">
                    <ColSelect
                      value={filters.paidTo}
                      onChange={(v) => setF('paidTo', v)}
                      options={options.paidTo.map((v) => ({ value: v, label: v }))}
                    />
                  </th>
                  <th className="py-2 pr-2">
                    <ColSelect
                      value={filters.method}
                      onChange={(v) => setF('method', v)}
                      options={options.method.map((v) => ({
                        value: v,
                        label: prettyMethod(v),
                      }))}
                    />
                  </th>
                  {hasLocals && (
                    <th className="py-2 pr-2">
                      <ColSelect
                        value={filters.local}
                        onChange={(v) => setF('local', v)}
                        options={options.local.map((v) => ({ value: v, label: v }))}
                      />
                    </th>
                  )}
                  <th className="py-2 pl-2" />
                </tr>
              </thead>
              <tbody>
                {groups.length ? (
                  groups.map((g) => (
                    <FragmentGroup key={g.day} g={g} hasLocals={hasLocals} />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={colCount + 1}
                      className="py-8 text-center text-sm text-gray-400"
                    >
                      No hay gastos que coincidan con los filtros
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 font-bold text-gray-900">
                  <td className="py-3 pr-4" colSpan={colCount}>
                    Total {anyFilter ? 'filtrado' : ''}
                  </td>
                  <td className="py-3 pl-4 text-right">
                    {formatMoney(filteredTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-gray-400">
            No hay gastos en el periodo
          </p>
        )}
      </ChartCard>
    </div>
  );
}

// Select compacto de filtro de columna.
function ColSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-lg border px-2 py-1 text-xs font-normal normal-case focus:border-orange-400 focus:outline-none ${
        value ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-gray-200'
      }`}
    >
      <option value="">Todos</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// Grupo de un día: cabecera con subtotal + movimientos del día.
function FragmentGroup({ g, hasLocals }) {
  const cols = hasLocals ? 6 : 5;
  return (
    <>
      <tr className="bg-gray-50/70 text-xs font-semibold text-gray-600">
        <td className="py-2 pr-4" colSpan={cols}>
          {shortDate(g.day)}
        </td>
        <td className="py-2 pl-4 text-right">{formatMoney(g.total)}</td>
      </tr>
      {g.items.map((e) => (
        <tr key={e.id} className="border-b border-gray-50 text-gray-700">
          <td className="whitespace-nowrap py-2 pr-4 text-gray-400">
            {shortDate(String(e.date).slice(0, 10))}
          </td>
          <td className="py-2 pr-4 font-medium text-gray-800">{e.concept}</td>
          <td className="py-2 pr-4">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {EXPENSE_TYPE_LABELS[e.type] || e.type}
            </span>
          </td>
          <td className="py-2 pr-4 text-gray-500">{e.paidTo || '—'}</td>
          <td className="py-2 pr-4 text-gray-500">{prettyMethod(e.paymentMethod)}</td>
          {hasLocals && <td className="py-2 pr-4 text-gray-500">{e.local}</td>}
          <td className="py-2 pl-4 text-right font-semibold text-gray-900">
            {formatMoney(e.amount)}
          </td>
        </tr>
      ))}
    </>
  );
}
