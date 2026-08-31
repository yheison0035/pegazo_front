'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import Button from '@/components/ui/Button';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { getCompareStats } from '@/lib/api/routes/statistics';
import {
  ChartCard,
  MoneyTooltip,
  formatMoney,
  formatShort,
  COLORS,
} from './statsUI';
import StatDetailModal from './StatDetailModal';

// YYYY-MM -> { startDate, endDate } (primer y último día del mes).
function monthToRange(ym) {
  const [y, m] = ym.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  const p = (n) => String(n).padStart(2, '0');
  return { startDate: `${ym}-01`, endDate: `${y}-${p(m)}-${p(last)}` };
}

function currentMonth(offset = 0) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const MONTHS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];
function monthLabel(ym) {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

// Variación porcentual de a respecto de b.
function pct(a, b) {
  if (!b) return a ? 100 : 0;
  return Math.round(((a - b) / Math.abs(b)) * 100);
}

const METRICS = [
  { key: 'totalSales', label: 'Ventas', money: true, detail: 'sales' },
  { key: 'salesCount', label: 'Nº de ventas', money: false },
  { key: 'avgTicket', label: 'Ticket promedio', money: true },
  { key: 'itemsSold', label: 'Ítems vendidos', money: false },
  {
    key: 'totalExpenses',
    label: 'Gastos',
    money: true,
    invert: true,
    detail: 'expenses',
  },
  { key: 'profit', label: 'Utilidad', money: true },
  { key: 'grossMargin', label: 'Margen bruto', money: true },
  { key: 'newCustomers', label: 'Clientes nuevos', money: false },
];

export default function CompareStats({ localId }) {
  const [monthA, setMonthA] = useState(currentMonth(0));
  const [monthB, setMonthB] = useState(currentMonth(-1));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  // Drill-down: { metric, period: 'a'|'b' } o null.
  const [drill, setDrill] = useState(null);

  const fetchCompare = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCompareStats({
        periodA: monthToRange(monthA),
        periodB: monthToRange(monthB),
        localId: localId || undefined,
      });
      if (res?.success) setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [monthA, monthB, localId]);

  useEffect(() => {
    fetchCompare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const a = data?.a?.summary;
  const b = data?.b?.summary;

  const chartData = useMemo(
    () =>
      (data?.series || []).map((r) => ({
        day: r.day,
        [`A`]: r.a,
        [`B`]: r.b,
      })),
    [data],
  );

  return (
    <div className="relative space-y-6">
      {loading && <LoadingOverlay />}

      {/* Selector de meses */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col">
          <label className="mb-1 text-xs font-semibold text-blue-600">
            Periodo A
          </label>
          <input
            type="month"
            value={monthA}
            max={currentMonth(0)}
            onChange={(e) => setMonthA(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="pb-2 text-sm font-semibold text-gray-400">vs</div>
        <div className="flex flex-col">
          <label className="mb-1 text-xs font-semibold text-orange-600">
            Periodo B
          </label>
          <input
            type="month"
            value={monthB}
            max={currentMonth(0)}
            onChange={(e) => setMonthB(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
        <Button variant="primary" onClick={fetchCompare}>
          Comparar
        </Button>
      </div>

      {a && b && (
        <>
          {/* Tabla comparativa */}
          <ChartCard
            title="Comparación de indicadores"
            subtitle={`${monthLabel(monthA)} vs ${monthLabel(monthB)}`}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="py-2 pr-4">Indicador</th>
                    <th className="py-2 pr-4 text-right">
                      <span className="text-blue-600">{monthLabel(monthA)}</span>
                    </th>
                    <th className="py-2 pr-4 text-right">
                      <span className="text-orange-600">
                        {monthLabel(monthB)}
                      </span>
                    </th>
                    <th className="py-2 pl-4 text-right">Variación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {METRICS.map((m) => {
                    const va = a[m.key] ?? 0;
                    const vb = b[m.key] ?? 0;
                    const change = pct(va, vb);
                    const up = change > 0;
                    const down = change < 0;
                    const good = m.invert ? down : up;
                    const bad = m.invert ? up : down;
                    const color = good
                      ? 'text-emerald-600'
                      : bad
                        ? 'text-red-600'
                        : 'text-gray-400';
                    const fmt = (v) => (m.money ? formatMoney(v) : v);
                    const Cell = ({ v, period, cls }) =>
                      m.detail ? (
                        <button
                          type="button"
                          onClick={() => setDrill({ metric: m, period })}
                          className={`rounded-md px-1.5 py-0.5 font-semibold text-blue-600 underline decoration-dotted underline-offset-2 hover:bg-blue-50 ${cls}`}
                          title="Ver detalle"
                        >
                          {fmt(v)}
                        </button>
                      ) : (
                        <span className={cls}>{fmt(v)}</span>
                      );
                    return (
                      <tr key={m.key} className="text-gray-700">
                        <td className="py-2.5 pr-4 font-medium text-gray-800">
                          {m.label}
                        </td>
                        <td className="py-2.5 pr-4 text-right font-semibold">
                          <Cell v={va} period="a" />
                        </td>
                        <td className="py-2.5 pr-4 text-right text-gray-500">
                          <Cell v={vb} period="b" cls="text-gray-500" />
                        </td>
                        <td
                          className={`py-2.5 pl-4 text-right font-semibold ${color}`}
                        >
                          {up ? '▲' : down ? '▼' : '•'} {Math.abs(change)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ChartCard>

          {/* Curvas superpuestas */}
          <ChartCard
            title="Ventas día a día"
            subtitle="Curvas superpuestas por día del mes"
          >
            {chartData.length ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid stroke={COLORS.grid} vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: COLORS.axis }}
                    tickFormatter={(d) => `Día ${d}`}
                    minTickGap={16}
                  />
                  <YAxis
                    tickFormatter={formatShort}
                    tick={{ fontSize: 11, fill: COLORS.axis }}
                    width={54}
                  />
                  <Tooltip
                    content={<MoneyTooltip />}
                    labelFormatter={(d) => `Día ${d}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="A"
                    name={monthLabel(monthA)}
                    stroke={COLORS.profit}
                    strokeWidth={2.5}
                    dot={false}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="B"
                    name={monthLabel(monthB)}
                    stroke={COLORS.expense}
                    strokeWidth={2.5}
                    strokeDasharray="5 4"
                    dot={false}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-gray-400">
                Sin datos para comparar
              </p>
            )}
          </ChartCard>
        </>
      )}

      {drill && (
        <StatDetailModal
          title={`${drill.metric.label} · ${monthLabel(
            drill.period === 'a' ? monthA : monthB,
          )}`}
          subtitle={
            drill.metric.detail === 'expenses'
              ? 'Movimientos del periodo'
              : 'De dónde vienen las ventas'
          }
          kind={drill.metric.detail}
          data={data?.[drill.period]}
          onClose={() => setDrill(null)}
        />
      )}
    </div>
  );
}
