'use client';

import { memo, useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { getSalesTrend } from '@/lib/api/routes/statistics';
import { formatCOP } from '@/lib/api/utils/utils';

const PERIODS = [
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
  { key: 'year', label: 'Año' },
];

// Abrevia valores para el eje Y: 45000 -> $45k, 8777500 -> $8.8M.
function abbrevCOP(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000)
    return `$${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}k`;
  return `$${v}`;
}

function TrendTooltip({ active, payload, label, showValues }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-gray-500">{label}</p>
      {showValues && (
        <p className="font-semibold text-gray-800">
          {formatCOP(payload[0].value)}
        </p>
      )}
    </div>
  );
}

// Gráfica de ventas con selector Semana/Mes/Año y navegación atrás/adelante en
// el tiempo. Autónoma (trae sus propios datos) y memoizada.
const SalesTrendChart = memo(function SalesTrendChart({ title = 'Ventas' }) {
  const [period, setPeriod] = useState('week');
  const [offset, setOffset] = useState(0); // 0 = actual, +1 = periodo anterior
  const [rows, setRows] = useState([]);
  const [showValues, setShowValues] = useState(true);
  const [rangeLabel, setRangeLabel] = useState('');
  const [canForward, setCanForward] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getSalesTrend(period, offset)
      .then((r) => {
        if (!alive) return;
        setRows(r?.data || []);
        setShowValues(r?.values !== false);
        setRangeLabel(r?.rangeLabel || '');
        setCanForward(!!r?.canForward);
      })
      .catch(() => {
        if (alive) setRows([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [period, offset]);

  const total = rows.reduce((a, b) => a + (b.total || 0), 0);
  const hasData = rows.some((r) => (r.total || 0) > 0);

  const changePeriod = (k) => {
    setPeriod(k);
    setOffset(0);
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          {/* atrás en el tiempo */}
          <button
            type="button"
            onClick={() => setOffset((o) => o + 1)}
            title="Periodo anterior"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-gray-700">{title}</h2>
            <p className="truncate text-xs text-gray-400">
              {rangeLabel || '—'}
              {showValues && (
                <>
                  {' · '}
                  <span className="font-semibold text-gray-600">
                    {formatCOP(total)}
                  </span>
                </>
              )}
            </p>
          </div>
          {/* adelante en el tiempo (hacia hoy) */}
          <button
            type="button"
            onClick={() => setOffset((o) => Math.max(0, o - 1))}
            disabled={!canForward}
            title="Periodo siguiente"
            className="rounded-lg p-1.5 text-gray-400 enabled:hover:bg-gray-100 enabled:hover:text-gray-700 disabled:opacity-30"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="inline-flex rounded-lg border border-gray-200 p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => changePeriod(p.key)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                period === p.key
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-56 w-full">
        {!hasData && !loading ? (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">
            Sin ventas en este periodo.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="trend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-orange-500)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--color-orange-500)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--color-gray-100)" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'var(--color-gray-400)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={16}
              />
              {showValues && (
                <YAxis
                  width={48}
                  tick={{ fontSize: 11, fill: 'var(--color-gray-400)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={abbrevCOP}
                />
              )}
              <Tooltip
                content={<TrendTooltip showValues={showValues} />}
                cursor={{ stroke: 'var(--color-gray-200)' }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="var(--color-orange-500)"
                strokeWidth={2.5}
                fill="url(#trend)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
});

export default SalesTrendChart;
