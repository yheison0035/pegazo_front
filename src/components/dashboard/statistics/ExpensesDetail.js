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

export default function ExpensesDetail({ data }) {
  const [typeFilter, setTypeFilter] = useState('');
  const detail = data?.expensesDetail || [];
  const byType = data?.expensesByType || [];

  const filtered = useMemo(() => {
    const list = typeFilter
      ? detail.filter((e) => e.type === typeFilter)
      : detail;
    return [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [detail, typeFilter]);

  const filteredTotal = useMemo(
    () => filtered.reduce((s, e) => s + e.amount, 0),
    [filtered],
  );

  // Agrupa por día para mostrar subtotales diarios.
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

  const totalExpenses = data?.summary?.totalExpenses || 0;

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

      {/* Gastos por tipo */}
      <ChartCard title="Gastos por categoría" subtitle="Distribución del periodo">
        {byType.length ? (
          <ResponsiveContainer width="100%" height={Math.max(200, byType.length * 38)}>
            <BarChart data={byType} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid stroke={COLORS.grid} horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={formatShort}
                tick={{ fontSize: 11, fill: COLORS.axis }}
              />
              <YAxis
                type="category"
                dataKey="type"
                width={150}
                tickFormatter={(v) => truncate(EXPENSE_TYPE_LABELS[v] || v, 18)}
                tick={{ fontSize: 11, fill: COLORS.axis }}
              />
              <Tooltip
                content={<MoneyTooltip />}
                cursor={{ fill: '#f8fafc' }}
                labelFormatter={(v) => EXPENSE_TYPE_LABELS[v] || v}
              />
              <Bar dataKey="total" name="Gastos" radius={[0, 4, 4, 0]}>
                {byType.map((e, i) => (
                  <Cell key={e.type} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-8 text-center text-sm text-gray-400">
            No hay gastos en el periodo
          </p>
        )}
      </ChartCard>

      {/* Detalle con fecha de pago */}
      <ChartCard
        title="Detalle de gastos"
        subtitle="Cada movimiento con su fecha de pago"
      >
        {/* Filtro por tipo */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="">Todas las categorías</option>
            {byType.map((e) => (
              <option key={e.type} value={e.type}>
                {EXPENSE_TYPE_LABELS[e.type] || e.type}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-500">
            {filtered.length} movimiento(s) ·{' '}
            <span className="font-semibold text-gray-800">
              {formatMoney(filteredTotal)}
            </span>
          </span>
        </div>

        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-2 pr-4">Fecha de pago</th>
                  <th className="py-2 pr-4">Concepto</th>
                  <th className="py-2 pr-4">Categoría</th>
                  <th className="py-2 pr-4">Pagado a</th>
                  <th className="py-2 pr-4">Método</th>
                  {data?.hasMultipleLocals && <th className="py-2 pr-4">Sede</th>}
                  <th className="py-2 pl-4 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <FragmentGroup
                    key={g.day}
                    g={g}
                    hasMultipleLocals={data?.hasMultipleLocals}
                  />
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 font-bold text-gray-900">
                  <td className="py-3 pr-4" colSpan={data?.hasMultipleLocals ? 6 : 5}>
                    Total
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
            No hay gastos que coincidan con el filtro
          </p>
        )}
      </ChartCard>
    </div>
  );
}

// Grupo de un día: fila cabecera con subtotal + movimientos del día.
function FragmentGroup({ g, hasMultipleLocals }) {
  const cols = hasMultipleLocals ? 6 : 5;
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
          {hasMultipleLocals && (
            <td className="py-2 pr-4 text-gray-500">{e.local}</td>
          )}
          <td className="py-2 pl-4 text-right font-semibold text-gray-900">
            {formatMoney(e.amount)}
          </td>
        </tr>
      ))}
    </>
  );
}
