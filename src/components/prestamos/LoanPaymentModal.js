'use client';

import { useMemo, useState } from 'react';
import { XMarkIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { addLoanPayment, emitLoansChanged } from '@/lib/api/routes/loans';
import { formatCOP, formatDateOnly } from '@/lib/api/utils/utils';
import { useToast } from '@/context/toastContext';
import Button from '@/components/ui/Button';
import MoneyInput from '@/components/ui/MoneyInput';

const METHODS = [
  { id: 'EFECTIVO', name: 'Efectivo' },
  { id: 'TRANSFERENCIA', name: 'Transferencia' },
  { id: 'BANCOLOMBIA', name: 'Bancolombia' },
  { id: 'DATAFONO', name: 'Datáfono' },
];

const todayISO = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

// Registrar un abono a un préstamo. El reparto (mora → interés → capital) lo
// hace el backend; aquí se muestra lo pendiente para elegir el monto rápido.
export default function LoanPaymentModal({ loan, onClose, onSaved }) {
  const toast = useToast();
  const s = loan?.summary || {};
  const pending = (loan?.installments || []).filter((i) => i.status !== 'PAGADA');
  const next = pending[0] || null;

  const [amount, setAmount] = useState(next ? next.pendingTotal : '');
  const [method, setMethod] = useState('EFECTIVO');
  const [paidAt, setPaidAt] = useState(todayISO());
  const [note, setNote] = useState('');
  const [target, setTarget] = useState('');
  const [saving, setSaving] = useState(false);

  const quick = useMemo(() => {
    const list = [];
    if (next) list.push({ label: `Cuota ${next.number}`, value: next.pendingTotal });
    if (pending.length > 1) {
      const two = pending.slice(0, 2).reduce((a, i) => a + i.pendingTotal, 0);
      list.push({ label: '2 cuotas', value: two });
    }
    if (s.overdueAmount > 0) list.push({ label: 'Lo vencido', value: s.overdueAmount });
    if (s.pendingTotal > 0) list.push({ label: 'Saldar todo', value: s.pendingTotal });
    return list.filter((q, idx, arr) => q.value > 0 && arr.findIndex((x) => x.value === q.value) === idx);
  }, [next, pending, s.overdueAmount, s.pendingTotal]);

  const submit = async (e) => {
    e?.preventDefault?.();
    const n = Number(amount) || 0;
    if (n <= 0) {
      toast.show({ type: 'error', message: 'Ingresa el valor del abono.' });
      return;
    }
    if (n > (s.pendingTotal || 0)) {
      toast.show({ type: 'error', message: `El abono supera la deuda a hoy (${formatCOP(s.pendingTotal || 0)}).` });
      return;
    }
    setSaving(true);
    try {
      const dto = { amount: n, method, note: note || undefined };
      if (paidAt) dto.paidAt = new Date(`${paidAt}T12:00:00`).toISOString();
      if (target) dto.targetInstallmentNumber = Number(target);
      const res = await addLoanPayment(loan.id, dto);
      emitLoansChanged();
      toast.show({
        type: 'success',
        message: res?.data?.settled ? '¡Préstamo saldado!' : 'Abono registrado',
      });
      onSaved?.(res?.data);
      onClose?.();
    } catch (err) {
      toast.show({ type: 'error', message: err?.message || 'No se pudo registrar el abono.' });
    } finally {
      setSaving(false);
    }
  };

  if (!loan) return null;
  return (
    <div className="fixed inset-0 z-[105] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <BanknotesIcon className="h-5 w-5 text-orange-500" /> Registrar abono
            </h3>
            <p className="text-sm text-gray-500">
              {loan.code} · {loan.customer?.name}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl bg-gray-50 p-2">
            <p className="text-gray-500">Deuda a hoy</p>
            <p className="font-semibold text-gray-900">{formatCOP(s.pendingTotal || 0)}</p>
          </div>
          <div className="rounded-xl bg-red-50 p-2">
            <p className="text-red-600">Vencido</p>
            <p className="font-semibold text-red-700">{formatCOP(s.overdueAmount || 0)}</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-2">
            <p className="text-amber-700">Mora</p>
            <p className="font-semibold text-amber-800">{formatCOP(s.moraAccrued || 0)}</p>
          </div>
        </div>

        {quick.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {quick.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => setAmount(q.value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  Number(amount) === q.value ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {q.label} · {formatCOP(q.value)}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-xs font-medium text-gray-500">Valor del abono</span>
            <MoneyInput
              value={amount}
              onChange={setAmount}
              name="amount"
              className="mt-0.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-medium text-gray-500">Medio de pago</span>
            <select name="method" value={method} onChange={(e) => setMethod(e.target.value)} className="mt-0.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
              {METHODS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-xs font-medium text-gray-500">Fecha</span>
            <input type="date" name="paidAt" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className="mt-0.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-medium text-gray-500">Aplicar primero a</span>
            <select name="target" value={target} onChange={(e) => setTarget(e.target.value)} className="mt-0.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
              <option value="">Cuota más antigua (recomendado)</option>
              {pending.map((i) => (
                <option key={i.number} value={i.number}>
                  Cuota {i.number} · vence {formatDateOnly(i.dueDate)} · {formatCOP(i.pendingTotal)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-xs font-medium text-gray-500">Observación (opcional)</span>
            <input name="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej: pagó en la ruta de la mañana" className="mt-0.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={saving}>Registrar abono</Button>
        </div>
      </form>
    </div>
  );
}
