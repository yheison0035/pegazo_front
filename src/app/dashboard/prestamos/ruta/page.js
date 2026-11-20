'use client';

import { useCallback, useEffect, useState } from 'react';
import useLiveRefresh from '@/hooks/useLiveRefresh';
import { MapPinIcon, BanknotesIcon, PhoneIcon } from '@heroicons/react/24/outline';
import LoanGuard, { hasLoansModule } from '@/components/prestamos/LoanGuard';
import { getCollectorRoute, LOANS_CHANGED_EVENT } from '@/lib/api/routes/loans';
import { getUsers } from '@/lib/api/routes/users';
import { formatCOP, formatDateOnly } from '@/lib/api/utils/utils';
import { overdueTone } from '@/lib/loanPlan';
import { useAuth } from '@/context/authContext';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import WhatsappLink from '@/components/dashboard/tables/segments/contentData/whatsappLink';
import LoanPaymentModal from '@/components/prestamos/LoanPaymentModal';
import LoanDetailModal from '@/components/prestamos/LoanDetailModal';
import LoanReceiptModal from '@/components/prestamos/LoanReceiptModal';

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'COORDINADOR', 'COBRADOR'];
const todayISO = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

function Card({ loan, onPay, onOpen, canPay }) {
  const s = loan.summary || {};
  const tone = overdueTone(s.overdueDays);
  const msg = `Hola ${loan.customer?.name}, te recordamos tu cuota del préstamo ${loan.code} por ${formatCOP(s.nextInstallmentAmount || 0)}${s.nextDueDate ? ` (vence ${formatDateOnly(s.nextDueDate)})` : ''}. ¡Gracias!`;
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={() => onOpen(loan)} className="text-left">
          <p className="font-semibold text-gray-900">{loan.customer?.name}</p>
          <p className="text-xs text-gray-500">{loan.code} · {loan.customer?.address || ''}{loan.customer?.city ? ` · ${loan.customer.city}` : ''}</p>
        </button>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tone.cls}`}>{tone.label}</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-xl bg-gray-50 p-2"><p className="text-gray-500">Cuota</p><p className="font-semibold text-gray-900">{formatCOP(s.nextInstallmentAmount || 0)}</p></div>
        <div className="rounded-xl bg-red-50 p-2"><p className="text-red-600">Vencido</p><p className="font-semibold text-red-700">{formatCOP(s.overdueAmount || 0)}</p></div>
        <div className="rounded-xl bg-gray-50 p-2"><p className="text-gray-500">Deuda total</p><p className="font-semibold text-gray-900">{formatCOP(s.pendingTotal || 0)}</p></div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-sm">
          {loan.customer?.phone && (
            <>
              <WhatsappLink phone={loan.customer.phone} message={msg} />
              <a href={`tel:${loan.customer.phone}`} className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-800" onClick={(e) => e.stopPropagation()}>
                <PhoneIcon className="h-4 w-4" /> Llamar
              </a>
            </>
          )}
        </div>
        {canPay && (
          <Button variant="primary" size="sm" icon={BanknotesIcon} onClick={() => onPay(loan)} aria-label={`Abonar ${loan.code}`}>Abonar</Button>
        )}
      </div>
    </div>
  );
}

export default function RutaPage() {
  const { usuario } = useAuth();
  const role = usuario?.role;
  const isCollector = role === 'COBRADOR';
  const enabled = hasLoansModule(usuario);
  const [date, setDate] = useState(todayISO());
  const [collectors, setCollectors] = useState([]);
  const [collectorId, setCollectorId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pay, setPay] = useState(null);
  const [detail, setDetail] = useState(null);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    if (isCollector || !enabled) return undefined;
    (async () => {
      try {
        const u = await getUsers({ status: 'ACTIVO', limit: 1000 });
        const users = Array.isArray(u?.data) ? u.data : [];
        const cob = users.filter((x) => x.role === 'COBRADOR');
        setCollectors(cob);
        if (cob[0] && !collectorId) setCollectorId(String(cob[0].id));
      } catch {
        setCollectors([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCollector]);

  const load = useCallback(async () => {
    if (!enabled || (!isCollector && !collectorId)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = { date };
      if (!isCollector) params.collectorId = collectorId;
      const res = await getCollectorRoute(params);
      setData(res?.data && !Array.isArray(res.data) ? res.data : null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, isCollector, collectorId, date]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    const onChange = () => load();
    window.addEventListener(LOANS_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(LOANS_CHANGED_EVENT, onChange);
  }, [load]);
  useLiveRefresh(load);

  const t = data?.totals || {};
  const groups = [
    { key: 'dueToday', title: 'Vencen hoy', items: data?.dueToday || [], tone: 'text-orange-700' },
    { key: 'overdue', title: 'En mora', items: data?.overdue || [], tone: 'text-red-700' },
    { key: 'upcoming', title: 'Próximos', items: data?.upcoming || [], tone: 'text-gray-700' },
  ];
  const empty = !loading && groups.every((g) => g.items.length === 0);

  return (
    <LoanGuard roles={ROLES}>
      <div className="w-full p-4">
        {loading && <LoadingOverlay />}
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-800">
              <MapPinIcon className="h-7 w-7 text-orange-500" /> {isCollector ? 'Mi ruta de cobro' : 'Ruta de cobro'}
            </h1>
            <p className="text-sm text-gray-500">Cuotas que vencen hoy, en mora y próximas, con abono en un toque.</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            {!isCollector && (
              <label className="block text-sm">
                <span className="text-xs font-medium text-gray-500">Cobrador</span>
                <select value={collectorId} onChange={(e) => setCollectorId(e.target.value)} className="mt-0.5 block rounded-xl border border-gray-200 px-3 py-2 text-sm" aria-label="Cobrador">
                  {collectors.length === 0 && <option value="">Sin cobradores</option>}
                  {collectors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
            )}
            <label className="block text-sm">
              <span className="text-xs font-medium text-gray-500">Día</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-0.5 block rounded-xl border border-gray-200 px-3 py-2 text-sm" />
            </label>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><p className="text-xs uppercase text-gray-400">Por cobrar hoy</p><p className="text-xl font-bold text-gray-900">{formatCOP(t.toCollectToday || 0)}</p></div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><p className="text-xs uppercase text-gray-400">Vencido</p><p className="text-xl font-bold text-red-600">{formatCOP(t.overdueAmount || 0)}</p></div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><p className="text-xs uppercase text-gray-400">Recaudado hoy</p><p className="text-xl font-bold text-emerald-700">{formatCOP(t.collectedToday || 0)}</p><p className="text-xs text-gray-500">{t.collectedCount || 0} abonos · efectivo {formatCOP(t.collectedCashToday || 0)}</p></div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><p className="text-xs uppercase text-gray-400">Cartera asignada</p><p className="text-xl font-bold text-gray-900">{formatCOP(t.portfolio || 0)}</p><p className="text-xs text-gray-500">{t.loans || 0} préstamos</p></div>
        </div>

        {empty ? (
          <EmptyState icon={MapPinIcon} title="Nada que cobrar en esta fecha" subtitle="No hay cuotas que venzan hoy ni en mora para esta cartera." />
        ) : (
          groups.map((g) => g.items.length > 0 && (
            <section key={g.key} className="mb-5">
              <h2 className={`mb-2 text-sm font-semibold uppercase tracking-wide ${g.tone}`}>{g.title} · {g.items.length}</h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {g.items.map((l) => (
                  <Card key={l.id} loan={l} onPay={setPay} onOpen={setDetail} canPay={['SUPER_ADMIN', 'ADMIN', 'CAJA', 'COBRADOR'].includes(role)} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {pay && (
        <LoanPaymentModal
          loan={pay}
          onClose={() => setPay(null)}
          onSaved={(data) => {
            load();
            if (data?.payment) setReceipt({ payment: data.payment, loan: data.loan || pay });
          }}
        />
      )}
      {receipt && <LoanReceiptModal payment={receipt.payment} loan={receipt.loan} onClose={() => setReceipt(null)} />}
      {detail && <LoanDetailModal loanId={detail.id} initial={detail} onClose={() => setDetail(null)} onChanged={load} />}
    </LoanGuard>
  );
}
