'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChartBarSquareIcon } from '@heroicons/react/24/outline';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import LoanGuard, { hasLoansModule } from '@/components/prestamos/LoanGuard';
import { getLoansSummary, getLoansMonthlyReport, LOANS_CHANGED_EVENT } from '@/lib/api/routes/loans';
import { formatCOP } from '@/lib/api/utils/utils';
import { KpiCard, ChartCard, MoneyTooltip, COLORS, formatShort } from '@/components/dashboard/statistics/statsUI';
import { useAuth } from '@/context/authContext';
import { useLocalScope } from '@/context/localScopeContext';
import ExportCsvButton from '@/components/ui/ExportCsvButton';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import EmptyState from '@/components/ui/EmptyState';

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'COORDINADOR', 'CONTADOR'];
const MONTH = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const monthLabel = (ym) => {
  const [y, m] = String(ym).split('-').map(Number);
  return `${MONTH[(m || 1) - 1]} ${String(y).slice(2)}`;
};

export default function ReportesCarteraPage() {
  const { usuario } = useAuth();
  const { activeLocal } = useLocalScope();
  const enabled = hasLoansModule(usuario);
  const [months, setMonths] = useState(6);
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const scope = activeLocal ? { localId: activeLocal } : {};
      const [s, m] = await Promise.all([getLoansSummary(scope), getLoansMonthlyReport({ months, ...scope })]);
      setSummary(s?.data && !Array.isArray(s.data) ? s.data : null);
      setMonthly(m?.data && !Array.isArray(m.data) ? m.data : null);
    } catch {
      setSummary(null);
      setMonthly(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, activeLocal, months]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    const onChange = () => load();
    window.addEventListener(LOANS_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(LOANS_CHANGED_EVENT, onChange);
  }, [load]);

  const aging = summary?.aging || {};
  const agingRows = [
    { label: '1 – 30 días', value: aging.d0_30 || 0, cls: 'bg-orange-400' },
    { label: '31 – 60 días', value: aging.d31_60 || 0, cls: 'bg-amber-500' },
    { label: '61 – 90 días', value: aging.d61_90 || 0, cls: 'bg-red-500' },
    { label: 'Más de 90 días', value: aging.d90p || 0, cls: 'bg-red-800' },
  ];
  const agingTotal = agingRows.reduce((a, r) => a + r.value, 0);
  const series = (monthly?.months || []).map((r) => ({ ...r, name: monthLabel(r.month) }));
  const byCollector = summary?.byCollector || [];

  return (
    <LoanGuard roles={ROLES}>
      <div className="w-full p-4">
        {loading && <LoadingOverlay />}
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-800">
              <ChartBarSquareIcon className="h-7 w-7 text-orange-500" /> Reportes de cartera
            </h1>
            <p className="text-sm text-gray-500">Colocación vs. recaudo, intereses ganados, mora por edades y recaudo por cobrador.</p>
          </div>
          <div className="flex items-end gap-2">
            <label className="block text-sm">
              <span className="text-xs font-medium text-gray-500">Periodo</span>
              <select value={months} onChange={(e) => setMonths(Number(e.target.value))} className="mt-0.5 block rounded-xl border border-gray-200 px-3 py-2 text-sm" aria-label="Periodo">
                <option value={3}>3 meses</option>
                <option value={6}>6 meses</option>
                <option value={12}>12 meses</option>
              </select>
            </label>
            <ExportCsvButton data={series.map(({ name, ...r }) => r)} filename="cartera-mensual.csv" />
          </div>
        </div>

        {summary && (
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <KpiCard label="Cartera activa" value={formatCOP(summary.portfolio)} />
            <KpiCard label="Capital en la calle" value={formatCOP(summary.pendingCapital)} />
            <KpiCard label="Intereses por cobrar" value={formatCOP(summary.pendingInterest)} />
            <KpiCard label="En mora" value={formatCOP(summary.overdueAmount)} accent={summary.overdueAmount ? 'text-red-600' : undefined} />
            <KpiCard label="Índice de mora" value={`${summary.moraIndex}%`} accent={summary.moraIndex > 10 ? 'text-red-600' : 'text-emerald-600'} />
            <KpiCard label="Intereses ganados (mes)" value={formatCOP(summary.collectedMonth?.interest)} accent="text-emerald-600" />
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="Colocación vs. recaudo" subtitle={`Últimos ${months} meses`} className="lg:col-span-2">
            {series.length ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={formatShort} tick={{ fontSize: 12 }} width={56} />
                    <Tooltip content={<MoneyTooltip />} />
                    <Legend />
                    <Bar dataKey="placed" name="Colocado" fill={COLORS.expense} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="collected" name="Recaudado" fill={COLORS.income} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="interest" name="Intereses" fill={COLORS.profit} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title="Sin datos en el periodo" />
            )}
            {monthly?.totals && (
              <p className="mt-2 text-xs text-gray-500">
                Total colocado {formatCOP(monthly.totals.placed)} · recaudado {formatCOP(monthly.totals.collected)} · intereses {formatCOP(monthly.totals.interest)} · mora cobrada {formatCOP(monthly.totals.mora)}
              </p>
            )}
          </ChartCard>

          <ChartCard title="Cartera vencida por edades" subtitle={agingTotal ? `Total en mora ${formatCOP(agingTotal)}` : 'Sin mora'}>
            <div className="space-y-3">
              {agingRows.map((r) => (
                <div key={r.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{r.label}</span>
                    <span className="font-semibold text-gray-900">{formatCOP(r.value)}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className={`h-2 rounded-full ${r.cls}`} style={{ width: agingTotal ? `${Math.round((r.value / agingTotal) * 100)}%` : '0%' }} />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <ChartCard title="Recaudo por cobrador" subtitle="Mes actual · comisión según el % de cada cobrador">
            {byCollector.length ? (
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <tr><th className="py-1">Cobrador</th><th className="py-1 text-right">Cartera</th><th className="py-1 text-right">En mora</th><th className="py-1 text-right">Recaudo mes</th><th className="py-1 text-right">Comisión</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {byCollector.map((c) => (
                    <tr key={c.id ?? 'none'}>
                      <td className="py-1.5 font-medium text-gray-900">{c.name}<span className="block text-xs text-gray-400">{c.loans} préstamos</span></td>
                      <td className="py-1.5 text-right">{formatCOP(c.portfolio)}</td>
                      <td className={`py-1.5 text-right ${c.overdue ? 'text-red-600' : 'text-gray-500'}`}>{formatCOP(c.overdue)}</td>
                      <td className="py-1.5 text-right text-emerald-700">{formatCOP(c.collectedMonth || 0)}<span className="block text-xs text-gray-400">{c.collectedCount || 0} abonos</span></td>
                      <td className="py-1.5 text-right">{c.commissionRate != null ? <>{formatCOP(c.commission || 0)}<span className="block text-xs text-gray-400">{c.commissionRate}%</span></> : <span className="text-xs text-gray-400">Sin % configurado</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState title="Sin cobradores con cartera" />
            )}
          </ChartCard>

          <ChartCard title="Mayor atraso" subtitle="Los 10 préstamos con más días de mora">
            {summary?.topOverdue?.length ? (
              <ul className="divide-y divide-gray-100 text-sm">
                {summary.topOverdue.map((l) => (
                  <li key={l.id} className="flex items-center justify-between py-1.5">
                    <span><span className="font-medium text-gray-900">{l.customer?.name}</span><span className="ml-2 text-xs text-gray-400">{l.code}{l.collector ? ` · ${l.collector.name}` : ''}</span></span>
                    <span className="text-right"><span className="font-semibold text-red-600">{formatCOP(l.overdueAmount)}</span><span className="block text-xs text-gray-400">{l.overdueDays} días</span></span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Nadie en mora 🎉" />
            )}
          </ChartCard>
        </div>
      </div>
    </LoanGuard>
  );
}
