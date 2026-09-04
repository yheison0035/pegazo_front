'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import { useAuth } from '@/context/authContext';
import { cycleMonthRange, cycleStartOf } from '@/lib/cycle';
import useLocals from '@/lib/api/hooks/useLocals';
import { getDashboardStats } from '@/lib/api/routes/statistics';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import Button from '@/components/ui/Button';
import {
  PALETTE,
  COLORS,
  KpiCard,
  ChartCard,
  MoneyTooltip,
  formatShort,
  formatMoney,
  shortDate,
  truncate,
} from '@/components/dashboard/statistics/statsUI';
import CompareStats from '@/components/dashboard/statistics/CompareStats';
import ExpensesDetail, {
  EXPENSE_TYPE_LABELS,
} from '@/components/dashboard/statistics/ExpensesDetail';
import AnnualStats from '@/components/dashboard/statistics/AnnualStats';
import ProfitLoss from '@/components/dashboard/statistics/ProfitLoss';
import CashFlow from '@/components/dashboard/statistics/CashFlow';
import TaxReport from '@/components/dashboard/statistics/TaxReport';
import InventoryValuation from '@/components/dashboard/statistics/InventoryValuation';
import StatDetailModal from '@/components/dashboard/statistics/StatDetailModal';
import FilterableTable from '@/components/dashboard/statistics/FilterableTable';
import { exportCSV, csvNum } from '@/components/dashboard/statistics/exportUtils';
import useTerms from '@/hooks/useTerms';
import {
  CheckCircleIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';

const TABS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'comparar', label: 'Comparar meses' },
  { id: 'anual', label: 'Anual' },
  { id: 'gastos', label: 'Gastos' },
  { id: 'inventario', label: 'Inventario' },
  { id: 'impuestos', label: 'Impuestos' },
];

// Cartera por edades: agrupa las cuentas por cobrar según días de vencimiento.
function agingBuckets(items = []) {
  const now = Date.now();
  const buckets = [
    { label: 'Corriente (0-30)', min: 0, max: 30, total: 0, count: 0 },
    { label: '31-60 días', min: 31, max: 60, total: 0, count: 0 },
    { label: '61-90 días', min: 61, max: 90, total: 0, count: 0 },
    { label: 'Más de 90', min: 91, max: Infinity, total: 0, count: 0 },
  ];
  for (const it of items) {
    const days = Math.floor((now - new Date(it.date).getTime()) / 86400000);
    const b = buckets.find((x) => days >= x.min && days <= x.max) || buckets[0];
    b.total += it.amount;
    b.count += 1;
  }
  return buckets;
}

const todayCol = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
const daysAgoCol = (n) =>
  new Date(Date.now() - n * 86400000).toLocaleDateString('en-CA', {
    timeZone: 'America/Bogota',
  });

function EmptyChart({ height = 260 }) {
  return (
    <div
      className="flex items-center justify-center text-sm text-gray-400"
      style={{ height }}
    >
      Sin datos en este periodo
    </div>
  );
}

export default function Statistics() {
  const t = useTerms();
  const { getLocals } = useLocals();
  const { usuario } = useAuth();
  // Día de inicio del ciclo de cierre de la empresa (default 1 = mes calendario).
  const cycleDay = usuario?.company?.cycleStartDay || 1;

  const [locals, setLocals] = useState([]);
  const [localId, setLocalId] = useState('');
  // "Desde" arranca vacío: el backend lo resuelve a la primera venta registrada
  // y lo poblamos con el rango que devuelve.
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(todayCol());

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('resumen');
  // Modal de detalle al hacer clic en una tarjeta del Resumen ('sales'|'expenses').
  const [resumenDrill, setResumenDrill] = useState(null);

  useEffect(() => {
    getLocals()
      .then((res) => setLocals(res?.data || []))
      .catch(() => {});
  }, [getLocals]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDashboardStats({
        startDate,
        endDate,
        ...(localId ? { localId: String(localId) } : {}),
      });
      setData(res?.data || null);
      // Si "Desde" venía vacío, mostramos la fecha que el backend resolvió
      // (la de la primera venta registrada).
      const range = res?.data?.range;
      if (range?.startDate) {
        setStartDate((prev) => prev || range.startDate);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, localId]);

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aplica un rango explícito (para los atajos) y recarga.
  const applyRange = useCallback(
    async (from, to) => {
      setStartDate(from);
      setEndDate(to);
      setLoading(true);
      try {
        const res = await getDashboardStats({
          startDate: from,
          endDate: to,
          ...(localId ? { localId: String(localId) } : {}),
        });
        setData(res?.data || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [localId],
  );

  // Atajos de rango (fechas en horario de Colombia).
  const PRESETS = [
    {
      label: 'Este mes',
      // Respeta el ciclo de cierre: inicio del ciclo actual → hoy.
      range: () => [cycleStartOf(cycleDay, todayCol()), todayCol()],
    },
    {
      label: 'Mes pasado',
      // Ciclo anterior completo (según el día de inicio de la empresa).
      range: () => cycleMonthRange(cycleDay, todayCol(), -1),
    },
    { label: 'Últimos 30 días', range: () => [daysAgoCol(29), todayCol()] },
    {
      label: 'Este año',
      range: () => [`${todayCol().slice(0, 4)}-01-01`, todayCol()],
    },
  ];

  const s = data?.summary;

  const rangeLabel = data?.range
    ? `${data.range.startDate} a ${data.range.endDate}`
    : '';

  // Exportar el Resumen a Excel (CSV): indicadores + tops + gastos por tipo.
  const exportResumen = () => {
    if (!data) return;
    const rows = [
      ['Estadísticas Pegazo', rangeLabel],
      [],
      ['INDICADOR', 'VALOR'],
      ['Ventas', csvNum(s.totalSales)],
      ['Nº de ventas', s.salesCount],
      ['Ticket promedio', csvNum(s.avgTicket)],
      ['Costo de ventas', csvNum(s.costOfGoods)],
      ['Utilidad bruta', csvNum(s.grossMargin)],
      ['Gastos', csvNum(s.totalExpenses)],
      ['Utilidad neta', csvNum(s.profit)],
      ['Clientes nuevos', s.newCustomers],
      [],
      ['GASTOS POR CATEGORÍA', 'MONTO'],
      ...(data.expensesByType || []).map((e) => [
        EXPENSE_TYPE_LABELS[e.type] || e.type,
        csvNum(e.total),
      ]),
      [],
      ['TOP CLIENTES', 'COMPRAS', 'Nº'],
      ...(data.topCustomers || []).map((c) => [c.name, csvNum(c.total), c.count]),
      [],
      ['RENTABILIDAD POR PRODUCTO', 'VENDIDO', 'COSTO', 'UTILIDAD', 'MARGEN %'],
      ...(data.productProfit || []).map((p) => [
        p.name,
        csvNum(p.revenue),
        csvNum(p.cost),
        csvNum(p.profit),
        p.margin,
      ]),
    ];
    exportCSV(`Pegazo-resumen`, rows);
  };

  // Exportar el detalle de gastos (con fecha de pago) a Excel (CSV).
  const exportGastos = () => {
    if (!data) return;
    const rows = [
      ['Detalle de gastos', rangeLabel],
      [],
      ['FECHA', 'CONCEPTO', 'CATEGORÍA', 'PAGADO A', 'MÉTODO', 'SEDE', 'MONTO'],
      ...(data.expensesDetail || []).map((e) => [
        String(e.date).slice(0, 10),
        e.concept,
        EXPENSE_TYPE_LABELS[e.type] || e.type,
        e.paidTo || '',
        e.paymentMethod || '',
        e.local || '',
        csvNum(e.amount),
      ]),
    ];
    exportCSV(`Pegazo-gastos`, rows);
  };

  const handleExport = () => {
    if (tab === 'gastos') exportGastos();
    else exportResumen();
  };

  return (
    <RoleGuard
      allowedRoles={[Roles.SUPER_ADMIN, Roles.ADMIN, Roles.COORDINADOR]}
    >
      <div id="stats-print" className="relative w-full p-4">
        <LoadingOverlay show={loading} text="Cargando estadísticas..." />

        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-gray-800">Estadísticas</h1>
          <p className="text-sm text-gray-500">
            Cómo va tu empresa — ventas, rentabilidad, productos y clientes.
          </p>
        </div>

        {/* Pestañas + exportar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-gray-200 bg-white p-0.5 shadow-sm print:hidden">
            {TABS.map((tb) => (
              <button
                key={tb.id}
                type="button"
                onClick={() => setTab(tb.id)}
                className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition sm:px-4 ${
                  tab === tb.id
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tb.label}
              </button>
            ))}
          </div>
          {(tab === 'resumen' || tab === 'gastos') && (
            <div className="flex items-center gap-2 print:hidden">
              <Button
                variant="secondary"
                icon={ArrowDownTrayIcon}
                onClick={handleExport}
              >
                Excel
              </Button>
              <Button
                variant="secondary"
                icon={PrinterIcon}
                onClick={() => window.print()}
              >
                PDF
              </Button>
            </div>
          )}
        </div>

        {tab === 'comparar' && <CompareStats localId={localId} />}

        {tab === 'anual' && (
          <AnnualStats
            localId={localId}
            onSelectMonth={(from, to) => {
              setTab('resumen');
              applyRange(from, to);
            }}
          />
        )}

        {tab === 'impuestos' && (
          <TaxReport startDate={startDate} endDate={endDate} />
        )}

        {tab === 'inventario' && <InventoryValuation />}

        {/* Filtros (Resumen y Gastos comparten el rango de fechas) */}
        <div
          className={`mb-6 flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm print:hidden ${
            tab === 'resumen' || tab === 'gastos' || tab === 'impuestos'
              ? 'flex'
              : 'hidden'
          }`}
        >
          <div className="flex flex-col">
            <label className="mb-1 text-xs font-semibold uppercase text-gray-500">
              Desde
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-xs font-semibold uppercase text-gray-500">
              Hasta
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-xs font-semibold uppercase text-gray-500">
              Sede
            </label>
            <select
              value={localId}
              onChange={(e) => setLocalId(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">Todas las sedes</option>
              {locals.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <Button variant="primary" onClick={fetchStats}>
            Aplicar
          </Button>

          {/* Atajos de rango */}
          <div className="flex w-full flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold uppercase text-gray-400">
              Atajos:
            </span>
            {PRESETS.map((p) => {
              const [from, to] = p.range();
              const active = startDate === from && endDate === to;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyRange(from, to)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    active
                      ? 'border-orange-300 bg-orange-50 text-orange-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ---- Pestaña Gastos ---- */}
        {tab === 'gastos' &&
          (data ? (
            <ExpensesDetail data={data} />
          ) : (
            <p className="py-10 text-center text-sm text-gray-400">
              Sin datos en este periodo.
            </p>
          ))}

        {/* ---- Pestaña Resumen ---- */}
        {tab === 'resumen' && (
        <>
        {/* KPIs */}
        {s && (
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            <KpiCard
              label="Ventas"
              value={formatMoney(s.totalSales)}
              delta={s.deltas.totalSales}
              accent={COLORS.income}
              onClick={() => setResumenDrill('sales')}
            />
            <KpiCard
              label="Nº de ventas"
              value={s.salesCount}
              delta={s.deltas.salesCount}
              accent={COLORS.profit}
            />
            <KpiCard
              label="Ticket promedio"
              value={formatMoney(s.avgTicket)}
              delta={s.deltas.avgTicket}
              accent={PALETTE[3]}
            />
            <KpiCard
              label="Gastos"
              value={formatMoney(s.totalExpenses)}
              delta={s.deltas.totalExpenses}
              invert
              accent={COLORS.expense}
              onClick={() => setResumenDrill('expenses')}
            />
            <KpiCard
              label="Utilidad/Ganancia"
              value={formatMoney(s.profit)}
              delta={s.deltas.profit}
              accent={PALETTE[5]}
            />
            {s.grossMargin !== undefined && (
              <KpiCard
                label={`Margen bruto (${s.grossMarginPct}%)`}
                value={formatMoney(s.grossMargin)}
                accent={COLORS.profit}
              />
            )}
            <KpiCard
              label="Clientes nuevos"
              value={s.newCustomers}
              delta={s.deltas.newCustomers}
              accent={PALETTE[4]}
            />
          </div>
        )}

        {/* Estado de resultados (P&G) + Flujo de caja */}
        {s && (
          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <ProfitLoss data={data} />
            <CashFlow data={data} />
          </div>
        )}

        {/* Ingresos vs Gastos */}
        <div className="mb-6">
          <ChartCard
            title="Ingresos vs Gastos"
            subtitle="Evolución en el periodo"
          >
            {data?.series?.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={data.series}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={COLORS.income}
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor={COLORS.income}
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={COLORS.expense}
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor={COLORS.expense}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={COLORS.grid} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={shortDate}
                    tick={{ fontSize: 11, fill: COLORS.axis }}
                    minTickGap={24}
                  />
                  <YAxis
                    tickFormatter={formatShort}
                    tick={{ fontSize: 11, fill: COLORS.axis }}
                    width={54}
                  />
                  <Tooltip
                    content={<MoneyTooltip />}
                    labelFormatter={shortDate}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="ventas"
                    name="Ingresos"
                    stroke={COLORS.income}
                    strokeWidth={2}
                    fill="url(#gIncome)"
                  />
                  <Area
                    type="monotone"
                    dataKey="gastos"
                    name="Gastos"
                    stroke={COLORS.expense}
                    strokeWidth={2}
                    fill="url(#gExpense)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart height={300} />
            )}
          </ChartCard>
        </div>

        {/* Métodos de pago + Por sede/Gastos */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <ChartCard title="Ventas por método de pago">
            {data?.paymentMethods?.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={data.paymentMethods}
                    dataKey="total"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {data.paymentMethods.map((entry, i) => (
                      <Cell
                        key={entry.method}
                        fill={PALETTE[i % PALETTE.length]}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<MoneyTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart height={280} />
            )}
          </ChartCard>

          <ChartCard
            title={
              data?.hasMultipleLocals ? 'Ventas por sede' : 'Gastos por tipo'
            }
          >
            {data?.hasMultipleLocals ? (
              data?.byLocal?.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.byLocal} layout="vertical">
                    <CartesianGrid stroke={COLORS.grid} horizontal={false} />
                    <XAxis
                      type="number"
                      tickFormatter={formatShort}
                      tick={{ fontSize: 11, fill: COLORS.axis }}
                    />
                    <YAxis
                      type="category"
                      dataKey="local"
                      width={150}
                      tickFormatter={(v) => truncate(v, 18)}
                      tick={{ fontSize: 11, fill: COLORS.axis }}
                    />
                    <Tooltip
                      content={<MoneyTooltip />}
                      cursor={{ fill: '#f8fafc' }}
                    />
                    <Bar dataKey="total" name="Ventas" radius={[0, 4, 4, 0]}>
                      {data.byLocal.map((e, i) => (
                        <Cell key={e.local} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart height={280} />
              )
            ) : data?.expensesByType?.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.expensesByType} layout="vertical">
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
                    tickFormatter={(v) => truncate(v, 18)}
                    tick={{ fontSize: 11, fill: COLORS.axis }}
                  />
                  <Tooltip
                    content={<MoneyTooltip />}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar
                    dataKey="total"
                    name="Gastos"
                    fill={COLORS.expense}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart height={280} />
            )}
          </ChartCard>
        </div>

        {/* Top productos + Top servicios */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <ChartCard
            title={`Top ${t.productPlural}`}
            subtitle="Por monto vendido"
          >
            {data?.topProducts?.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.topProducts} layout="vertical">
                  <CartesianGrid stroke={COLORS.grid} horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={formatShort}
                    tick={{ fontSize: 11, fill: COLORS.axis }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={160}
                    tickFormatter={(v) => truncate(v, 20)}
                    tick={{ fontSize: 11, fill: COLORS.axis }}
                  />
                  <Tooltip
                    content={<MoneyTooltip />}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar
                    dataKey="total"
                    name="Vendido"
                    fill={PALETTE[0]}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart height={300} />
            )}
          </ChartCard>

          <ChartCard
            title={`Top ${t.servicePlural}`}
            subtitle="Por monto vendido"
          >
            {data?.topServices?.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.topServices} layout="vertical">
                  <CartesianGrid stroke={COLORS.grid} horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={formatShort}
                    tick={{ fontSize: 11, fill: COLORS.axis }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={160}
                    tickFormatter={(v) => truncate(v, 20)}
                    tick={{ fontSize: 11, fill: COLORS.axis }}
                  />
                  <Tooltip
                    content={<MoneyTooltip />}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar
                    dataKey="total"
                    name="Vendido"
                    fill={PALETTE[2]}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart height={300} />
            )}
          </ChartCard>
        </div>

        {/* Top vendedores */}
        <div className="mb-6">
          <ChartCard
            title={`Top ${t.attendantPlural}`}
            subtitle="Por ventas del periodo"
          >
            {data?.topSellers?.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.topSellers}>
                  <CartesianGrid stroke={COLORS.grid} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(v) => truncate(v, 16)}
                    tick={{ fontSize: 11, fill: COLORS.axis }}
                  />
                  <YAxis
                    tickFormatter={formatShort}
                    tick={{ fontSize: 11, fill: COLORS.axis }}
                    width={54}
                  />
                  <Tooltip
                    content={<MoneyTooltip />}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="total" name="Ventas" radius={[4, 4, 0, 0]}>
                    {data.topSellers.map((e, i) => (
                      <Cell key={e.name} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart height={280} />
            )}
          </ChartCard>
        </div>

        {/* Top clientes */}
        <div className="mb-6">
          <ChartCard
            title="Top clientes"
            subtitle="Quiénes compran más en el periodo"
          >
            {data?.topCustomers?.length ? (
              <FilterableTable
                rows={data.topCustomers}
                initialSort={{ key: 'total', dir: 'desc' }}
                columns={[
                  {
                    key: 'name',
                    label: 'Cliente',
                    filter: 'text',
                    value: (r) => r.name,
                  },
                  {
                    key: 'count',
                    label: 'Nº compras',
                    align: 'right',
                    value: (r) => r.count,
                  },
                  {
                    key: 'total',
                    label: 'Total comprado',
                    align: 'right',
                    isMoney: true,
                    total: true,
                    value: (r) => r.total,
                  },
                ]}
              />
            ) : (
              <div className="py-8 text-center text-sm text-gray-400">
                Aún no hay clientes identificados con compras (las ventas a
                Consumidor Final no se cuentan aquí).
              </div>
            )}
          </ChartCard>
        </div>

        {/* Rentabilidad por producto */}
        {data?.productProfit?.length > 0 && (
          <div className="mb-6">
            <ChartCard
              title="Rentabilidad por producto"
              subtitle="Vendido menos costo = utilidad real por artículo"
            >
              <FilterableTable
                rows={data.productProfit}
                initialSort={{ key: 'profit', dir: 'desc' }}
                columns={[
                  {
                    key: 'name',
                    label: 'Producto',
                    filter: 'text',
                    value: (r) => r.name,
                  },
                  {
                    key: 'quantity',
                    label: 'Uds.',
                    align: 'right',
                    value: (r) => r.quantity,
                  },
                  {
                    key: 'revenue',
                    label: 'Vendido',
                    align: 'right',
                    isMoney: true,
                    total: true,
                    value: (r) => r.revenue,
                  },
                  {
                    key: 'cost',
                    label: 'Costo',
                    align: 'right',
                    isMoney: true,
                    total: true,
                    value: (r) => r.cost,
                  },
                  {
                    key: 'profit',
                    label: 'Utilidad',
                    align: 'right',
                    isMoney: true,
                    total: true,
                    value: (r) => r.profit,
                  },
                  {
                    key: 'margin',
                    label: 'Margen',
                    align: 'right',
                    value: (r) => r.margin,
                    render: (r) => (
                      <span
                        className={
                          r.margin >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }
                      >
                        {r.margin}%
                      </span>
                    ),
                  },
                ]}
              />
            </ChartCard>
          </div>
        )}

        {/* Por cobrar (Fiado) */}
        <div className="mb-6">
          <ChartCard
            title="Por cobrar (Fiado)"
            subtitle={
              data?.receivables?.count
                ? `${data.receivables.count} venta(s) a crédito pendientes de cobro`
                : 'Ventas a crédito aún sin cobrar'
            }
          >
            {data?.receivables?.count ? (
              <div>
                <div className="mb-4 flex items-baseline gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Total por cobrar
                  </span>
                  <span className="text-xl font-bold text-amber-600">
                    {formatMoney(data.receivables.total)}
                  </span>
                </div>

                {/* Cartera por edades */}
                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {agingBuckets(data.receivables.items).map((b, i) => (
                    <div
                      key={b.label}
                      className={`rounded-xl border p-3 ${
                        i === 0
                          ? 'border-emerald-100 bg-emerald-50'
                          : i === 3
                            ? 'border-red-100 bg-red-50'
                            : 'border-amber-100 bg-amber-50'
                      }`}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        {b.label}
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-gray-900">
                        {formatMoney(b.total)}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {b.count} venta(s)
                      </p>
                    </div>
                  ))}
                </div>

                <FilterableTable
                  rows={data.receivables.items}
                  initialSort={{ key: 'amount', dir: 'desc' }}
                  columns={[
                    {
                      key: 'customer',
                      label: 'Cliente',
                      filter: 'text',
                      value: (r) => r.customer,
                    },
                    {
                      key: 'amount',
                      label: 'Monto',
                      align: 'right',
                      isMoney: true,
                      total: true,
                      value: (r) => r.amount,
                    },
                    {
                      key: 'date',
                      label: 'Fecha',
                      value: (r) => r.date,
                      sortValue: (r) => new Date(r.date).getTime(),
                      render: (r) => shortDate(String(r.date).slice(0, 10)),
                    },
                    ...(data?.hasMultipleLocals
                      ? [
                          {
                            key: 'local',
                            label: 'Sede',
                            filter: 'select',
                            value: (r) => r.local,
                          },
                        ]
                      : []),
                  ]}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 py-8 text-center text-sm text-gray-400">
                <CheckCircleIcon className="h-8 w-8 text-emerald-400" />
                No hay ventas a crédito pendientes
              </div>
            )}
          </ChartCard>
        </div>
        </>
        )}

        {/* Modal de detalle del Resumen (clic en tarjeta Ventas/Gastos) */}
        {resumenDrill && data && (
          <StatDetailModal
            title={resumenDrill === 'expenses' ? 'Detalle de gastos' : 'Detalle de ventas'}
            subtitle={rangeLabel}
            kind={resumenDrill}
            data={data}
            onClose={() => setResumenDrill(null)}
          />
        )}
      </div>
    </RoleGuard>
  );
}
