'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import {
  getAccountantPortfolio,
  getAccCompanyFinancials,
} from '@/lib/api/routes/accountant';

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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function Line({ label, value, strong, indent }) {
  return (
    <div
      className={`flex items-center justify-between py-1.5 ${indent ? 'pl-3' : ''} ${
        strong ? 'font-bold text-gray-900' : 'text-gray-600'
      }`}
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

export default function ContadorEmpresa() {
  const { companyId } = useParams();
  const [company, setCompany] = useState(null);
  const [start, setStart] = useState(firstOfMonth());
  const [end, setEnd] = useState(today());
  const [tab, setTab] = useState('pyg');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Nombre de la empresa (del portafolio).
  useEffect(() => {
    getAccountantPortfolio()
      .then((r) => {
        const c = (r?.data || []).find((x) => String(x.companyId) === String(companyId));
        setCompany(c || null);
      })
      .catch(() => {});
  }, [companyId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAccCompanyFinancials(companyId, { startDate: start, endDate: end });
      setData(res?.data || null);
    } catch (e) {
      setError(e.message || 'No se pudo cargar.');
    } finally {
      setLoading(false);
    }
  }, [companyId, start, end]);

  useEffect(() => {
    load();
  }, [load]);

  const pyg = data?.incomeStatement;
  const bal = data?.balanceSheet;
  const flujo = data?.cashFlow;

  return (
    <div>
      <Link href="/contador" className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange-600">
        <ArrowLeftIcon className="h-4 w-4" /> Mis empresas
      </Link>

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">
          {company?.name || 'Empresa'}
        </h1>
        <p className="text-sm text-gray-500">
          Estados financieros{company?.nit ? ` · NIT ${company.nit}` : ''}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex rounded-xl bg-gray-100 p-1">
          {[
            ['pyg', 'Resultados'],
            ['balance', 'Balance'],
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
          <label className="mb-1 block text-[11px] font-semibold text-gray-500">Desde</label>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-gray-500">Hasta</label>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      {loading && <p className="text-sm text-gray-400">Calculando…</p>}

      {tab === 'pyg' && pyg && (
        <div className="space-y-3">
          <Section title="Ingresos">
            {pyg.income.length ? pyg.income.map((a) => <Line key={a.code} label={`${a.code} · ${a.name}`} value={a.value} indent />) : <p className="text-sm text-gray-400">Sin ingresos.</p>}
            <Line label="Total ingresos" value={pyg.totalIncome} strong />
          </Section>
          {pyg.costs.length > 0 && (
            <Section title="Costos">
              {pyg.costs.map((a) => <Line key={a.code} label={`${a.code} · ${a.name}`} value={a.value} indent />)}
              <Line label="Total costos" value={pyg.totalCosts} strong />
            </Section>
          )}
          <Section title="Gastos">
            {pyg.expenses.length ? pyg.expenses.map((a) => <Line key={a.code} label={`${a.code} · ${a.name}`} value={a.value} indent />) : <p className="text-sm text-gray-400">Sin gastos.</p>}
            <Line label="Total gastos" value={pyg.totalExpenses} strong />
          </Section>
          <div className={`rounded-2xl px-6 py-4 text-white ${pyg.netProfit >= 0 ? 'bg-emerald-600' : 'bg-red-600'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold uppercase">{pyg.netProfit >= 0 ? 'Utilidad neta' : 'Pérdida neta'}</span>
              <span className="text-xl font-bold tabular-nums">{cop(pyg.netProfit)}</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'balance' && bal && (
        <div className="space-y-3">
          <Section title="Activos">
            {bal.assets.map((a) => <Line key={a.code} label={`${a.code} · ${a.name}`} value={a.value} indent />)}
            <Line label="Total activos" value={bal.totalAssets} strong />
          </Section>
          <Section title="Pasivos">
            {bal.liabilities.length ? bal.liabilities.map((a) => <Line key={a.code} label={`${a.code} · ${a.name}`} value={a.value} indent />) : <p className="text-sm text-gray-400">Sin pasivos.</p>}
            <Line label="Total pasivos" value={bal.totalLiabilities} strong />
          </Section>
          <Section title="Patrimonio">
            {bal.equity.map((a) => <Line key={a.code} label={`${a.code} · ${a.name}`} value={a.value} indent />)}
            <Line label="Resultado del ejercicio" value={bal.retainedResult} indent />
            <Line label="Total patrimonio" value={bal.totalEquity} strong />
          </Section>
          <div className="rounded-2xl bg-gray-900 px-6 py-3 text-white">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Pasivo + Patrimonio</span>
              <span className="text-lg font-bold tabular-nums">{cop(bal.totalLiabilities + bal.totalEquity)}</span>
            </div>
            <p className="mt-1 text-[11px] text-white/60">{bal.balanced ? '✓ Cuadra con los activos' : '⚠ Descuadre'}</p>
          </div>
        </div>
      )}

      {tab === 'flujo' && flujo && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm">
            <p className="text-[10px] font-semibold uppercase text-gray-400">Entradas</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-emerald-600">{cop(flujo.totalIn)}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm">
            <p className="text-[10px] font-semibold uppercase text-gray-400">Salidas</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-red-500">{cop(flujo.totalOut)}</p>
          </div>
          <div className={`rounded-2xl p-4 text-center text-white shadow-sm ${flujo.net >= 0 ? 'bg-emerald-600' : 'bg-red-600'}`}>
            <p className="text-[10px] font-semibold uppercase text-white/80">Flujo neto</p>
            <p className="mt-1 text-lg font-bold tabular-nums">{cop(flujo.net)}</p>
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-gray-400">
        Libros, plan de cuentas y calendario de esta empresa llegan en el
        siguiente paso.
      </p>
    </div>
  );
}
