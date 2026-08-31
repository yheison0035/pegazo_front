'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { getAnnualStats } from '@/lib/api/routes/statistics';
import { exportCSV, csvNum } from './exportUtils';
import {
  ChartCard,
  MoneyTooltip,
  formatMoney,
  formatShort,
  COLORS,
} from './statsUI';

const MONTHS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export default function AnnualStats({ localId }) {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAnnual = useCallback(
    async (y) => {
      setLoading(true);
      try {
        const res = await getAnnualStats({
          year: y,
          localId: localId || undefined,
        });
        if (res?.success) setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    [localId],
  );

  useEffect(() => {
    fetchAnnual(year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chartData = useMemo(
    () =>
      (data?.months || []).map((m) => ({
        name: MONTHS[m.month - 1],
        Ingresos: m.ventas,
        Gastos: m.gastos,
        Utilidad: m.utilidad,
      })),
    [data],
  );

  const t = data?.totals;

  const changeYear = (y) => {
    setYear(y);
    fetchAnnual(y);
  };

  const handleExport = () => {
    if (!data) return;
    const rows = [
      ['Mes', 'Ventas', 'Costo de ventas', 'Utilidad bruta', 'Gastos', 'Utilidad neta', 'Nº ventas'],
      ...data.months.map((m) => [
        MONTHS[m.month - 1],
        csvNum(m.ventas),
        csvNum(m.costoVentas),
        csvNum(m.utilidadBruta),
        csvNum(m.gastos),
        csvNum(m.utilidad),
        m.count,
      ]),
      [
        'TOTAL',
        csvNum(t.ventas),
        csvNum(t.costoVentas),
        csvNum(t.ventas - t.costoVentas),
        csvNum(t.gastos),
        csvNum(t.utilidad),
        t.count,
      ],
    ];
    exportCSV(`Pegazo-anual-${year}`, rows);
  };

  return (
    <div className="relative space-y-6">
      {loading && <LoadingOverlay />}

      {/* Selector de año + exportar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
          {[thisYear - 2, thisYear - 1, thisYear].map((y) => (
            <button
              key={y}
              onClick={() => changeYear(y)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                year === y
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
        <Button variant="secondary" onClick={handleExport} icon={ArrowDownTrayIcon}>
          Excel
        </Button>
      </div>

      {/* Totales del año */}
      {t && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <YearCard label="Ventas del año" value={formatMoney(t.ventas)} color="text-emerald-600" />
          <YearCard label="Gastos del año" value={formatMoney(t.gastos)} color="text-orange-600" />
          <YearCard
            label="Utilidad del año"
            value={formatMoney(t.utilidad)}
            color={t.utilidad >= 0 ? 'text-blue-600' : 'text-red-600'}
          />
          <YearCard label="Nº de ventas" value={t.count} color="text-gray-700" />
        </div>
      )}

      {/* Gráfica 12 meses */}
      <ChartCard title={`Ingresos, gastos y utilidad · ${year}`} subtitle="Mes a mes">
        {chartData.length ? (
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={COLORS.grid} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: COLORS.axis }} />
              <YAxis tickFormatter={formatShort} tick={{ fontSize: 11, fill: COLORS.axis }} width={54} />
              <Tooltip content={<MoneyTooltip />} />
              <Legend />
              <Bar dataKey="Ingresos" fill={COLORS.income} radius={[4, 4, 0, 0]} maxBarSize={26} />
              <Bar dataKey="Gastos" fill={COLORS.expense} radius={[4, 4, 0, 0]} maxBarSize={26} />
              <Line type="monotone" dataKey="Utilidad" stroke={COLORS.profit} strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-10 text-center text-sm text-gray-400">Sin datos para {year}</p>
        )}
      </ChartCard>

      {/* Tabla mensual */}
      <ChartCard title="Detalle mensual" subtitle="Ventas, costo, utilidad bruta, gastos y utilidad neta">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="py-2 pr-4">Mes</th>
                <th className="py-2 pr-4 text-right">Ventas</th>
                <th className="py-2 pr-4 text-right">Costo ventas</th>
                <th className="py-2 pr-4 text-right">Utilidad bruta</th>
                <th className="py-2 pr-4 text-right">Gastos</th>
                <th className="py-2 pr-4 text-right">Utilidad neta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.months || []).map((m) => (
                <tr key={m.month} className="text-gray-700">
                  <td className="py-2 pr-4 font-medium text-gray-800">{MONTHS[m.month - 1]}</td>
                  <td className="py-2 pr-4 text-right">{formatMoney(m.ventas)}</td>
                  <td className="py-2 pr-4 text-right text-gray-400">{formatMoney(m.costoVentas)}</td>
                  <td className="py-2 pr-4 text-right">{formatMoney(m.utilidadBruta)}</td>
                  <td className="py-2 pr-4 text-right text-orange-600">{formatMoney(m.gastos)}</td>
                  <td className={`py-2 pr-4 text-right font-semibold ${m.utilidad >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                    {formatMoney(m.utilidad)}
                  </td>
                </tr>
              ))}
            </tbody>
            {t && (
              <tfoot>
                <tr className="border-t-2 border-gray-200 font-bold text-gray-900">
                  <td className="py-3 pr-4">TOTAL</td>
                  <td className="py-3 pr-4 text-right">{formatMoney(t.ventas)}</td>
                  <td className="py-3 pr-4 text-right">{formatMoney(t.costoVentas)}</td>
                  <td className="py-3 pr-4 text-right">{formatMoney(t.ventas - t.costoVentas)}</td>
                  <td className="py-3 pr-4 text-right text-orange-600">{formatMoney(t.gastos)}</td>
                  <td className={`py-3 pr-4 text-right ${t.utilidad >= 0 ? '' : 'text-red-600'}`}>
                    {formatMoney(t.utilidad)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

function YearCard({ label, value, color }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-xl font-extrabold ${color}`}>{value}</p>
    </div>
  );
}
