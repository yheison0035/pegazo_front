'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import useLiveRefresh from '@/hooks/useLiveRefresh';
import {
  BanknotesIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  CalculatorIcon,
} from '@heroicons/react/24/outline';
import LoanGuard, { LOAN_ROLES, hasLoansModule } from '@/components/prestamos/LoanGuard';
import { getLoans, getLoansSummary, getLoanCollectors, LOANS_CHANGED_EVENT } from '@/lib/api/routes/loans';
import { formatCOP, formatDateOnly } from '@/lib/api/utils/utils';
import { FREQ_LABEL, overdueTone } from '@/lib/loanPlan';
import { useAuth } from '@/context/authContext';
import { useLocalScope } from '@/context/localScopeContext';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import NewLoanModal from '@/components/prestamos/NewLoanModal';
import LoanDetailModal from '@/components/prestamos/LoanDetailModal';

const CAN_CREATE = ['SUPER_ADMIN', 'ADMIN', 'ANALISTA', 'CAJA'];
const STATUS_OPTIONS = [
  { id: '', name: 'Vigentes (solicitados, aprobados y activos)' },
  { id: 'DESEMBOLSADO', name: 'Activos' },
  { id: 'SOLICITADO', name: 'Solicitados' },
  { id: 'APROBADO', name: 'Aprobados sin desembolsar' },
  { id: 'PAGADO', name: 'Pagados' },
  { id: 'ANULADO,RECHAZADO', name: 'Anulados / rechazados' },
  { id: 'ALL', name: 'Todos' },
];

function Kpi({ label, value, sub, tone = 'text-gray-900', icon: Icon }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
        {Icon && <Icon className="h-4 w-4" />} {label}
      </p>
      <p className={`mt-1 text-xl font-bold ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

export default function PrestamosPage() {
  const { usuario } = useAuth();
  const role = usuario?.role;
  const { activeLocal } = useLocalScope();
  const enabled = hasLoansModule(usuario);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [summary, setSummary] = useState(null);
  const [collectors, setCollectors] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [collectorId, setCollectorId] = useState('');
  const [openNew, setOpenNew] = useState(false);
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = {};
      if (activeLocal) params.localId = activeLocal;
      if (status) params.status = status;
      if (onlyOverdue) params.overdue = 'true';
      if (collectorId) params.collectorId = collectorId;
      if (search.trim()) params.search = search.trim();
      const [l, s] = await Promise.all([getLoans(params), getLoansSummary(activeLocal ? { localId: activeLocal } : {})]);
      setItems(Array.isArray(l?.data?.items) ? l.data.items : []);
      setKpis(l?.data?.kpis || null);
      setSummary(s?.data && !Array.isArray(s.data) ? s.data : null);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, activeLocal, status, onlyOverdue, collectorId, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  useEffect(() => {
    if (role === 'COBRADOR' || !enabled) return undefined;
    (async () => {
      try {
        const u = await getLoanCollectors();
        setCollectors(Array.isArray(u?.data) ? u.data : []);
      } catch {
        setCollectors([]);
      }
    })();
  }, [role, enabled]);

  useEffect(() => {
    const onChange = () => load();
    window.addEventListener(LOANS_CHANGED_EVENT, onChange);
    window.addEventListener('focus', onChange);
    return () => {
      window.removeEventListener(LOANS_CHANGED_EVENT, onChange);
      window.removeEventListener('focus', onChange);
    };
  }, [load]);
  useLiveRefresh(load);

  return (
    <LoanGuard roles={LOAN_ROLES}>
      <div className="w-full p-4">
        {loading && <LoadingOverlay />}

        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-800">
              <BanknotesIcon className="h-7 w-7 text-orange-500" /> Préstamos
            </h1>
            <p className="text-sm text-gray-500">Cartera de créditos: colocación, cobro, mora y abonos.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" href="/dashboard/prestamos/simulador" icon={CalculatorIcon}>Simulador</Button>
            {CAN_CREATE.includes(role) && (
              <Button variant="primary" icon={PlusIcon} onClick={() => setOpenNew(true)}>Nuevo préstamo</Button>
            )}
          </div>
        </div>

        {summary && (
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
            <Kpi label="Cartera activa" value={formatCOP(summary.portfolio)} sub={`${summary.activeLoans} préstamos`} />
            <Kpi label="En mora" value={formatCOP(summary.overdueAmount)} sub={`${summary.overdueLoans} préstamos · ${summary.moraIndex}%`} tone={summary.overdueAmount ? 'text-red-600' : 'text-gray-900'} icon={ExclamationTriangleIcon} />
            <Kpi label="Recaudo hoy" value={formatCOP(summary.collectedToday?.amount)} sub={`${summary.collectedToday?.count || 0} abonos`} tone="text-emerald-700" />
            <Kpi label="Recaudo del mes" value={formatCOP(summary.collectedMonth?.amount)} sub={`Intereses ${formatCOP(summary.collectedMonth?.interest)}`} tone="text-emerald-700" />
            <Kpi label="Colocado este mes" value={formatCOP(summary.placedMonth?.amount)} sub={`${summary.placedMonth?.count || 0} desembolsos`} />
            <Kpi label="Vencen en 7 días" value={formatCOP(summary.upcoming7?.amount)} sub={`${summary.upcoming7?.count || 0} cuotas`} />
          </div>
        )}

        {summary?.pendingApproval > 0 && (
          <p className="mb-3 rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-800">
            Hay <span className="font-semibold">{summary.pendingApproval}</span> solicitud(es) pendiente(s) de aprobación.{' '}
            <button type="button" className="font-semibold underline" onClick={() => setStatus('SOLICITADO')}>Ver</button>
          </p>
        )}

        {/* Filtros */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código, cliente, documento o teléfono"
              className="w-72 rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" aria-label="Estado">
            {STATUS_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          {role !== 'COBRADOR' && collectors.length > 0 && (
            <select value={collectorId} onChange={(e) => setCollectorId(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" aria-label="Cobrador">
              <option value="">Todos los cobradores</option>
              {collectors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm">
            <input type="checkbox" checked={onlyOverdue} onChange={(e) => setOnlyOverdue(e.target.checked)} /> Solo en mora
          </label>
          {kpis && (
            <span className="ml-auto text-xs text-gray-500">
              {kpis.count} préstamos · pendiente {formatCOP(kpis.pendingTotal)}
            </span>
          )}
        </div>

        {/* Tabla */}
        {!loading && items.length === 0 ? (
          <EmptyState
            icon={BanknotesIcon}
            title="No hay préstamos con estos filtros"
            subtitle={CAN_CREATE.includes(role) ? 'Crea el primero con “Nuevo préstamo”.' : undefined}
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2">Código</th>
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">Plan</th>
                  <th className="px-3 py-2 text-right">Capital</th>
                  <th className="px-3 py-2 text-right">Pagado</th>
                  <th className="px-3 py-2 text-right">Deuda a hoy</th>
                  <th className="px-3 py-2">Próxima cuota</th>
                  <th className="px-3 py-2">Mora</th>
                  <th className="px-3 py-2">Cobrador</th>
                  <th className="px-3 py-2">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((l) => {
                  const s = l.summary || {};
                  const tone = overdueTone(s.overdueDays);
                  return (
                    <tr key={l.id} onClick={() => setDetail(l)} className="cursor-pointer hover:bg-orange-50/40">
                      <td className="px-3 py-2 font-medium text-gray-900">{l.code}</td>
                      <td className="px-3 py-2">
                        {role === 'COBRADOR' ? (
                          <span className="font-medium text-gray-800">{l.customer?.name}</span>
                        ) : (
                          <Link href={`/dashboard/customers/${l.customer?.id}`} onClick={(e) => e.stopPropagation()} className="font-medium text-gray-800 hover:text-orange-600">{l.customer?.name}</Link>
                        )}
                        <span className="block text-xs text-gray-400">{l.customer?.document || ''}{l.customer?.phone ? ` · ${l.customer.phone}` : ''}</span>
                      </td>
                      <td className="px-3 py-2 text-gray-600">{l.termCount} × {FREQ_LABEL[l.frequency] || l.frequency}<span className="block text-xs text-gray-400">{l.interestRate}% mensual</span></td>
                      <td className="px-3 py-2 text-right">{formatCOP(l.principal)}</td>
                      <td className="px-3 py-2 text-right text-emerald-700">{formatCOP(s.paidTotal || 0)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">{formatCOP(s.pendingTotal || 0)}</td>
                      <td className="px-3 py-2 text-gray-600">{s.nextDueDate ? <>{formatDateOnly(s.nextDueDate)}<span className="block text-xs text-gray-400">{formatCOP(s.nextInstallmentAmount || 0)}</span></> : '—'}</td>
                      <td className="px-3 py-2">
                        {l.status === 'DESEMBOLSADO' ? (
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tone.cls}`}>{tone.label}</span>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{l.collector?.name || '—'}</td>
                      <td className="px-3 py-2"><StatusBadge status={l.status === 'DESEMBOLSADO' ? s.status : l.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <NewLoanModal open={openNew} onClose={() => setOpenNew(false)} onCreated={(loan) => { load(); if (loan?.id) setDetail(loan); }} />
      {detail && <LoanDetailModal loanId={detail.id} initial={detail} onClose={() => setDetail(null)} onChanged={load} />}
    </LoanGuard>
  );
}
