'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  getExtraCapitalQuote,
  addExtraCapital,
  getSettlementQuote,
  settleLoan,
  refinanceLoan,
  emitLoansChanged,
} from '@/lib/api/routes/loans';
import { formatCOP, formatDateOnly } from '@/lib/api/utils/utils';
import { LOAN_FREQUENCIES, LOAN_AMORTIZATIONS, FREQ_LABEL } from '@/lib/loanPlan';
import { useToast } from '@/context/toastContext';
import Button from '@/components/ui/Button';
import MoneyInput from '@/components/ui/MoneyInput';

const inputCls = 'mt-0.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500';
const METHODS = [
  { id: 'EFECTIVO', name: 'Efectivo' },
  { id: 'TRANSFERENCIA', name: 'Transferencia' },
  { id: 'BANCOLOMBIA', name: 'Bancolombia' },
  { id: 'DATAFONO', name: 'Datáfono' },
];

function Shell({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><XMarkIcon className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Row({ label, before, after, money = true }) {
  const f = (v) => (money ? formatCOP(v || 0) : v);
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span><span className="text-gray-400 line-through">{f(before)}</span> <span className="font-semibold text-gray-900">→ {f(after)}</span></span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Abono extraordinario a capital
// ---------------------------------------------------------------------------
export function ExtraCapitalModal({ loan, onClose, onSaved }) {
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('REDUCE_INSTALLMENT');
  const [method, setMethod] = useState('EFECTIVO');
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const n = Number(amount) || 0;
    if (!n) {
      setQuote(null);
      return undefined;
    }
    const t = setTimeout(async () => {
      try {
        const res = await getExtraCapitalQuote(loan.id, n, mode);
        setQuote(res?.data || null);
        setError('');
      } catch (err) {
        setQuote(null);
        setError(err?.message || 'No se pudo cotizar.');
      }
    }, 300);
    return () => clearTimeout(t);
  }, [amount, mode, loan.id]);

  const submit = async (e) => {
    e.preventDefault();
    const n = Number(amount) || 0;
    if (!n) return toast.show({ type: 'error', message: 'Ingresa el valor a abonar a capital.' });
    setSaving(true);
    try {
      const res = await addExtraCapital(loan.id, { amount: n, mode, method });
      emitLoansChanged();
      toast.show({ type: 'success', message: quote?.settled ? '¡Préstamo saldado!' : 'Abono a capital aplicado' });
      onSaved?.(res?.data);
      onClose();
    } catch (err) {
      toast.show({ type: 'error', message: err?.message || 'No se pudo aplicar el abono a capital.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Shell title="Abono a capital" subtitle={`${loan.code} · capital pendiente ${formatCOP(loan.summary?.pendingCapital || 0)}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <p className="rounded-xl bg-blue-50 p-3 text-xs text-blue-800">
          Baja el capital de la deuda y recalcula los intereses de lo que falta. Solo aplica con el préstamo al día.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-xs font-medium text-gray-500">Valor a capital</span>
            <MoneyInput name="amount" value={amount} onChange={setAmount} className={inputCls} />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-medium text-gray-500">Medio de pago</span>
            <select name="method" value={method} onChange={(e) => setMethod(e.target.value)} className={inputCls}>
              {METHODS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            ['REDUCE_INSTALLMENT', 'Bajar la cuota', 'Mismas cuotas, cada una más baja'],
            ['REDUCE_TERM', 'Acortar el plazo', 'Cuota parecida, menos cuotas'],
          ].map(([id, t, h]) => (
            <button key={id} type="button" onClick={() => setMode(id)} className={`rounded-xl border p-3 text-left text-sm ${mode === id ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
              <span className="block font-medium text-gray-900">{t}</span>
              <span className="text-xs text-gray-500">{h}</span>
            </button>
          ))}
        </div>
        {error && <p className="rounded-xl bg-red-50 p-2 text-xs text-red-700">{error}</p>}
        {quote && !quote.settled && (
          <div className="space-y-1 rounded-xl border border-gray-200 p-3">
            <Row label="Cuota" before={quote.installmentBefore} after={quote.installmentAfter} />
            <Row label="Intereses pendientes" before={quote.interestBefore} after={quote.interestAfter} />
            <Row label="Cuotas por pagar" before={quote.removedNumbers?.length} after={quote.newInstallments?.length} money={false} />
            <p className="pt-1 text-xs text-emerald-700">Te ahorras {formatCOP((quote.interestBefore || 0) - (quote.interestAfter || 0))} en intereses.</p>
          </div>
        )}
        {quote?.settled && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Con este abono el préstamo queda <b>saldado</b>.</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={saving} disabled={!quote}>Aplicar abono a capital</Button>
        </div>
      </form>
    </Shell>
  );
}

// ---------------------------------------------------------------------------
// Liquidación anticipada
// ---------------------------------------------------------------------------
export function SettleModal({ loan, onClose, onSaved }) {
  const toast = useToast();
  const [quote, setQuote] = useState(null);
  const [method, setMethod] = useState('EFECTIVO');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getSettlementQuote(loan.id);
        setQuote(res?.data || null);
      } catch (err) {
        toast.show({ type: 'error', message: err?.message || 'No se pudo cotizar la liquidación.' });
      }
    })();
  }, [loan.id, toast]);

  const submit = async () => {
    setSaving(true);
    try {
      const res = await settleLoan(loan.id, { method });
      emitLoansChanged();
      toast.show({ type: 'success', message: '¡Préstamo liquidado!' });
      onSaved?.(res?.data);
      onClose();
    } catch (err) {
      toast.show({ type: 'error', message: err?.message || 'No se pudo liquidar.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Shell title="Liquidar préstamo hoy" subtitle={`${loan.code} · ${loan.customer?.name}`} onClose={onClose}>
      {!quote ? (
        <p className="text-sm text-gray-400">Calculando…</p>
      ) : (
        <div className="space-y-3">
          <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
            <p className="text-xs uppercase tracking-wide text-orange-700">Total para saldar hoy</p>
            <p className="text-3xl font-bold text-gray-900">{formatCOP(quote.total)}</p>
            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Capital pendiente</dt><dd>{formatCOP(quote.capital)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Interés causado (cuotas {quote.installmentNumbersDue?.join(', ') || '—'})</dt><dd>{formatCOP(quote.interest)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Mora</dt><dd>{formatCOP(quote.mora)}</dd></div>
              <div className="flex justify-between text-emerald-700"><dt>Interés futuro perdonado</dt><dd>− {formatCOP(quote.forgivenInterest)}</dd></div>
            </dl>
            <p className="mt-2 text-xs text-gray-500">Si pagara cuota a cuota debería {formatCOP(quote.pendingTotalNormal || 0)}.</p>
          </div>
          <label className="block text-sm">
            <span className="text-xs font-medium text-gray-500">Medio de pago</span>
            <select name="method" value={method} onChange={(e) => setMethod(e.target.value)} className={inputCls}>
              {METHODS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="button" variant="primary" loading={saving} onClick={submit} disabled={!quote.total}>Liquidar por {formatCOP(quote.total)}</Button>
          </div>
        </div>
      )}
    </Shell>
  );
}

// ---------------------------------------------------------------------------
// Refinanciación
// ---------------------------------------------------------------------------
export function RefinanceModal({ loan, onClose, onSaved }) {
  const toast = useToast();
  const [quote, setQuote] = useState(null);
  const [termCount, setTermCount] = useState(loan.termCount || 6);
  const [frequency, setFrequency] = useState(loan.frequency || 'MENSUAL');
  const [amortization, setAmortization] = useState(loan.amortization || 'SIMPLE');
  const [interestRate, setInterestRate] = useState('');
  const [forgiveMora, setForgiveMora] = useState(false);
  const [firstDueDate, setFirstDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getSettlementQuote(loan.id);
        setQuote(res?.data || null);
      } catch {
        setQuote(null);
      }
    })();
  }, [loan.id]);

  const principal = quote ? quote.capital + quote.interest + (forgiveMora ? 0 : quote.mora) : 0;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dto = { termCount: Number(termCount), frequency, amortization, forgiveMora };
      if (interestRate !== '') dto.interestRate = Number(interestRate);
      if (firstDueDate) dto.firstDueDate = firstDueDate;
      const res = await refinanceLoan(loan.id, dto);
      emitLoansChanged();
      toast.show({ type: 'success', message: `Refinanciado en ${res?.data?.code || 'un préstamo nuevo'}` });
      onSaved?.(res?.data);
      onClose();
    } catch (err) {
      toast.show({ type: 'error', message: err?.message || 'No se pudo refinanciar.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Shell title="Refinanciar préstamo" subtitle={`${loan.code} · la deuda a hoy pasa a un préstamo nuevo`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div className="rounded-2xl border border-gray-200 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Nuevo capital</p>
          <p className="text-2xl font-bold text-gray-900">{formatCOP(principal)}</p>
          {quote && (
            <p className="text-xs text-gray-500">
              Capital {formatCOP(quote.capital)} + interés causado {formatCOP(quote.interest)}{quote.mora ? ` + mora ${formatCOP(quote.mora)}` : ''}
            </p>
          )}
          {quote?.mora > 0 && (
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input type="checkbox" name="forgiveMora" checked={forgiveMora} onChange={(e) => setForgiveMora(e.target.checked)} /> Perdonar la mora ({formatCOP(quote.mora)})
            </label>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm"><span className="text-xs font-medium text-gray-500">Número de cuotas</span><input name="termCount" type="number" min="1" value={termCount} onChange={(e) => setTermCount(e.target.value)} className={inputCls} /></label>
          <label className="block text-sm"><span className="text-xs font-medium text-gray-500">Frecuencia</span><select name="frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)} className={inputCls}>{LOAN_FREQUENCIES.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</select></label>
          <label className="block text-sm"><span className="text-xs font-medium text-gray-500">Tasa (% mensual)</span><input name="interestRate" type="number" step="0.01" min="0" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} placeholder={`${loan.interestRate} (actual)`} className={inputCls} /></label>
          <label className="block text-sm"><span className="text-xs font-medium text-gray-500">Sistema</span><select name="amortization" value={amortization} onChange={(e) => setAmortization(e.target.value)} className={inputCls}>{LOAN_AMORTIZATIONS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}</select></label>
          <label className="block text-sm sm:col-span-2"><span className="text-xs font-medium text-gray-500">Primera cuota (opcional)</span><input name="firstDueDate" type="date" value={firstDueDate} onChange={(e) => setFirstDueDate(e.target.value)} className={inputCls} /></label>
        </div>
        <p className="text-xs text-gray-500">El préstamo actual queda como <b>refinanciado</b>; el nuevo arranca hoy, {FREQ_LABEL[frequency]?.toLowerCase()} a {termCount} cuotas{firstDueDate ? ` desde el ${formatDateOnly(firstDueDate)}` : ''}. No se entrega dinero.</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={saving} disabled={!quote || principal <= 0}>Refinanciar</Button>
        </div>
      </form>
    </Shell>
  );
}
