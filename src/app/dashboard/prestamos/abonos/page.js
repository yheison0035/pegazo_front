'use client';

import { useCallback, useEffect, useState } from 'react';
import useLiveRefresh from '@/hooks/useLiveRefresh';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import LoanGuard, { hasLoansModule } from '@/components/prestamos/LoanGuard';
import { getLoanPaymentsHistory, LOANS_CHANGED_EVENT } from '@/lib/api/routes/loans';
import { getUsers } from '@/lib/api/routes/users';
import { formatCOP, formatDateTime } from '@/lib/api/utils/utils';
import { useAuth } from '@/context/authContext';
import { useLocalScope } from '@/context/localScopeContext';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import ExportCsvButton from '@/components/ui/ExportCsvButton';
import LoanDetailModal from '@/components/prestamos/LoanDetailModal';

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'COORDINADOR', 'CAJA', 'COBRADOR', 'CONTADOR'];
function defaultRange() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  const end = local.toISOString().slice(0, 10);
  return { start: `${end.slice(0, 7)}-01`, end };
}

export default function AbonosPage() {
  const { usuario } = useAuth();
  const role = usuario?.role;
  const { activeLocal } = useLocalScope();
  const enabled = hasLoansModule(usuario);
  const init = defaultRange();
  const [from, setFrom] = useState(init.start);
  const [to, setTo] = useState(init.end);
  const [collectorId, setCollectorId] = useState('');
  const [collectors, setCollectors] = useState([]);
  const [data, setData] = useState({ items: [], totals: {} });
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    if (role === 'COBRADOR' || !enabled) return undefined;
    (async () => {
      try {
        const u = await getUsers({ status: 'ACTIVO', limit: 1000 });
        setCollectors((Array.isArray(u?.data) ? u.data : []).filter((x) => x.role === 'COBRADOR'));
      } catch {
        setCollectors([]);
      }
    })();
  }, [role, enabled]);

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = { from, to };
      if (collectorId) params.collectorId = collectorId;
      if (activeLocal) params.localId = activeLocal;
      const res = await getLoanPaymentsHistory(params);
      const d = res?.data;
      setData(d && !Array.isArray(d) ? { items: d.items || [], totals: d.totals || {} } : { items: [], totals: {} });
    } catch {
      setData({ items: [], totals: {} });
    } finally {
      setLoading(false);
    }
  }, [enabled, from, to, collectorId, activeLocal]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    const onChange = () => load();
    window.addEventListener(LOANS_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(LOANS_CHANGED_EVENT, onChange);
  }, [load]);
  useLiveRefresh(load);

  const t = data.totals || {};
  const csv = data.items.map((p) => ({
    fecha: formatDateTime(p.paidAt), prestamo: p.loan?.code, cliente: p.loan?.customer?.name, medio: p.method,
    valor: p.amount, capital: p.capitalApplied, interes: p.interestApplied, mora: p.moraApplied, registro: p.createdBy?.name, estado: p.status, nota: p.note || '',
  }));

  return (
    <LoanGuard roles={ROLES}>
      <div className="w-full p-4">
        {loading && <LoadingOverlay />}
        <div className="mb-4">
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-800">
            <ClipboardDocumentListIcon className="h-7 w-7 text-orange-500" /> Abonos recibidos
          </h1>
          <p className="text-sm text-gray-500">Historial de recaudo con su reparto en capital, interés y mora.</p>
        </div>

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <label className="block text-sm"><span className="text-xs font-medium text-gray-500">Desde</span><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-0.5 block rounded-xl border border-gray-200 px-3 py-2 text-sm" /></label>
          <label className="block text-sm"><span className="text-xs font-medium text-gray-500">Hasta</span><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-0.5 block rounded-xl border border-gray-200 px-3 py-2 text-sm" /></label>
          {role !== 'COBRADOR' && collectors.length > 0 && (
            <label className="block text-sm"><span className="text-xs font-medium text-gray-500">Cobrador</span>
              <select value={collectorId} onChange={(e) => setCollectorId(e.target.value)} className="mt-0.5 block rounded-xl border border-gray-200 px-3 py-2 text-sm">
                <option value="">Todos</option>
                {collectors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          )}
          <Button variant="primary" onClick={load}>Consultar</Button>
          <ExportCsvButton data={csv} filename="abonos-prestamos.csv" />
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><p className="text-xs uppercase text-gray-400">Recaudado</p><p className="text-xl font-bold text-emerald-700">{formatCOP(t.amount || 0)}</p><p className="text-xs text-gray-500">{t.count || 0} abonos</p></div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><p className="text-xs uppercase text-gray-400">A capital</p><p className="text-xl font-bold text-gray-900">{formatCOP(t.capital || 0)}</p></div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><p className="text-xs uppercase text-gray-400">Intereses ganados</p><p className="text-xl font-bold text-gray-900">{formatCOP(t.interest || 0)}</p></div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><p className="text-xs uppercase text-gray-400">Mora cobrada</p><p className="text-xl font-bold text-gray-900">{formatCOP(t.mora || 0)}</p></div>
        </div>

        {!loading && data.items.length === 0 ? (
          <EmptyState icon={ClipboardDocumentListIcon} title="Sin abonos en el periodo" />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2">Fecha</th><th className="px-3 py-2">Préstamo</th><th className="px-3 py-2">Cliente</th><th className="px-3 py-2">Medio</th>
                  <th className="px-3 py-2 text-right">Valor</th><th className="px-3 py-2 text-right">Capital</th><th className="px-3 py-2 text-right">Interés</th><th className="px-3 py-2 text-right">Mora</th><th className="px-3 py-2">Registró</th><th className="px-3 py-2">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((p) => (
                  <tr key={p.id} onClick={() => setDetail({ id: p.loan?.id })} className={`cursor-pointer hover:bg-orange-50/40 ${p.status === 'ANULADO' ? 'text-gray-400 line-through' : ''}`}>
                    <td className="px-3 py-2">{formatDateTime(p.paidAt)}</td>
                    <td className="px-3 py-2 font-medium">{p.loan?.code}</td>
                    <td className="px-3 py-2">{p.loan?.customer?.name}</td>
                    <td className="px-3 py-2">{p.method}</td>
                    <td className="px-3 py-2 text-right font-semibold">{formatCOP(p.amount)}</td>
                    <td className="px-3 py-2 text-right">{formatCOP(p.capitalApplied)}</td>
                    <td className="px-3 py-2 text-right">{formatCOP(p.interestApplied)}</td>
                    <td className="px-3 py-2 text-right">{formatCOP(p.moraApplied)}</td>
                    <td className="px-3 py-2">{p.createdBy?.name || '—'}</td>
                    <td className="px-3 py-2">{p.status === 'ANULADO' ? 'Anulado' : 'Activo'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {detail?.id && <LoanDetailModal loanId={detail.id} onClose={() => setDetail(null)} onChanged={load} />}
    </LoanGuard>
  );
}
