'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon, BanknotesIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getSalePayments, addSalePayment } from '@/lib/api/routes/sales';
import {
  formatCOP,
  formatDateTime,
  formatDateOnly,
} from '@/lib/api/utils/utils';
import { FREQ_LABEL } from '@/lib/creditPlan';
import Button from '@/components/ui/Button';

const METHODS = [
  { id: 'EFECTIVO', name: 'Efectivo' },
  { id: 'BANCOLOMBIA', name: 'Bancolombia' },
  { id: 'TRANSFERENCIA', name: 'Transferencia' },
  { id: 'DATAFONO', name: 'Datáfono' },
];

const INSTALLMENT_CLS = {
  PAGADA: 'bg-emerald-100 text-emerald-700',
  PARCIAL: 'bg-amber-100 text-amber-700',
  VENCIDA: 'bg-red-100 text-red-700',
  PENDIENTE: 'bg-gray-100 text-gray-500',
};
const INSTALLMENT_LABEL = {
  PAGADA: 'Pagada',
  PARCIAL: 'Parcial',
  VENCIDA: 'Vencida',
  PENDIENTE: 'Pendiente',
};

// Parseo/format de dinero mientras se escribe (miles con puntos).
const parseMoney = (s) => Number(String(s).replace(/[^\d]/g, '')) || 0;

export default function AbonoModal({
  sale,
  onClose,
  onSaved,
  // Solo el dueño (lo decide la página): permite eliminar el crédito desde aquí.
  canDelete = false,
  onDelete,
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('EFECTIVO');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async (prefill = false) => {
    try {
      const res = await getSalePayments(sale.id);
      const d = res?.data || null;
      setData(d);
      // Si el crédito tiene cuotas, el monto arranca en la próxima cuota con
      // saldo, para que abonar "tome el valor de la cuota" por defecto.
      if (prefill) {
        const next = (d?.credit?.installments || []).find((i) => i.pending > 0);
        if (next) setAmount(String(next.pending));
      }
    } catch (e) {
      setError(e?.message || 'No se pudo cargar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sale.id]);

  const saldo = data?.saldo ?? sale.saldo ?? 0;
  const credit = data?.credit || null;
  const installments = credit?.installments || [];
  const pending = installments.filter((i) => i.pending > 0);
  // Suma del saldo de las primeras k cuotas pendientes (completa la actual y
  // sigue con las siguientes).
  const sumFirst = (k) =>
    pending.slice(0, k).reduce((a, i) => a + i.pending, 0);

  const value = parseMoney(amount);
  // ¿Cuántas cuotas cubre el monto escrito? (informativo para el usuario).
  let covers = 0;
  let acc = 0;
  for (const i of pending) {
    if (acc + i.pending <= value + 0.5) {
      acc += i.pending;
      covers += 1;
    } else break;
  }

  const submit = async () => {
    if (value <= 0) {
      setError('Ingresa un monto mayor a 0.');
      return;
    }
    if (value > saldo + 0.5) {
      setError(`El abono supera el saldo pendiente (${formatCOP(saldo)}).`);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await addSalePayment(sale.id, { amount: value, method, note });
      const pagada = res?.data?.pagada;
      onSaved?.({ pagada });
      if (pagada) {
        onClose();
      } else {
        setAmount('');
        setNote('');
        await load();
      }
    } catch (e) {
      setError(e?.message || 'No se pudo registrar el abono.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-orange-600 to-[#111827] px-5 py-4 text-white">
          <div className="flex items-center gap-2">
            <BanknotesIcon className="h-6 w-6" />
            <div>
              <h2 className="text-base font-bold leading-tight">
                Registrar abono
              </h2>
              <p className="text-xs opacity-80">
                {sale.code} · {sale.customer?.name || 'Consumidor final'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-white/10">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* Resumen del saldo */}
          <div className="mb-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-gray-50 px-2 py-2">
              <p className="text-[11px] uppercase text-gray-400">Total</p>
              <p className="text-sm font-semibold text-gray-800">
                {formatCOP(data?.total ?? sale.total)}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 px-2 py-2">
              <p className="text-[11px] uppercase text-gray-400">Abonado</p>
              <p className="text-sm font-semibold text-emerald-600">
                {formatCOP(data?.paid ?? sale.paid ?? 0)}
              </p>
            </div>
            <div className="rounded-xl bg-orange-50 px-2 py-2">
              <p className="text-[11px] uppercase text-orange-500">Saldo</p>
              <p className="text-sm font-bold text-orange-700">
                {formatCOP(saldo)}
              </p>
            </div>
          </div>

          {/* Plan de cuotas: estado y cuánto falta de cada una */}
          {installments.length > 0 && (
            <div className="mb-4 rounded-xl border border-orange-100 bg-orange-50/40 p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-1 text-[11px] text-gray-500">
                <span className="font-semibold uppercase tracking-wide text-orange-700">
                  Plan · {FREQ_LABEL[credit.frequency] || credit.frequency} ·{' '}
                  {credit.installmentsCount} cuotas
                </span>
                {credit.overdueDays > 0 && (
                  <span className="font-semibold text-red-600">
                    {credit.overdueDays}{' '}
                    {credit.overdueDays === 1 ? 'día' : 'días'} de mora
                  </span>
                )}
              </div>
              <ul className="max-h-36 space-y-1 overflow-y-auto">
                {installments.map((it) => (
                  <li
                    key={it.number}
                    className="flex items-center justify-between rounded-lg bg-white px-3 py-1.5 text-xs"
                  >
                    <span className="text-gray-500">
                      Cuota {it.number} · {formatDateOnly(it.dueDate)}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="tabular-nums font-semibold text-gray-800">
                        {formatCOP(it.amount)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          INSTALLMENT_CLS[it.status] || INSTALLMENT_CLS.PENDIENTE
                        }`}
                      >
                        {INSTALLMENT_LABEL[it.status] || it.status}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Formulario de abono */}
          <label className="text-xs font-medium text-gray-500">
            Monto a abonar
          </label>
          <input
            autoFocus
            inputMode="numeric"
            value={amount ? formatCOP(parseMoney(amount)) : ''}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="$ 0"
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          {/* Cuánto cubre el monto escrito (si hay plan de cuotas) */}
          {installments.length > 0 && value > 0 && (
            <p className="mt-1 text-[11px] text-gray-500">
              {value >= saldo - 0.5
                ? 'Salda la totalidad del crédito.'
                : covers > 0
                  ? `Cubre ${covers} ${covers === 1 ? 'cuota' : 'cuotas'}.`
                  : 'Abono parcial de la cuota actual.'}
            </p>
          )}

          {/* Atajos: pagar 1 ó 2 cuotas, o saldar todo */}
          <div className="mt-2 flex flex-wrap gap-2">
            {pending.length > 0 && (
              <button
                type="button"
                onClick={() => setAmount(String(sumFirst(1)))}
                className="rounded-lg bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700 hover:bg-orange-200"
              >
                1 cuota ({formatCOP(sumFirst(1))})
              </button>
            )}
            {pending.length > 1 && (
              <button
                type="button"
                onClick={() => setAmount(String(sumFirst(2)))}
                className="rounded-lg bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700 hover:bg-orange-200"
              >
                2 cuotas ({formatCOP(sumFirst(2))})
              </button>
            )}
            <button
              type="button"
              onClick={() => setAmount(String(saldo))}
              className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200"
            >
              Saldar todo ({formatCOP(saldo)})
            </button>
          </div>

          <label className="mt-4 block text-xs font-medium text-gray-500">
            Método de pago
          </label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  method === m.id
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>

          <label className="mt-4 block text-xs font-medium text-gray-500">
            Nota (opcional)
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej: abono en efectivo"
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          {/* Historial de abonos */}
          {!loading && data?.payments?.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Abonos registrados
              </p>
              <ul className="space-y-1.5">
                {data.payments.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-1.5 text-sm"
                  >
                    <span className="text-gray-700">
                      {formatCOP(p.amount)}
                      <span className="ml-1 text-xs text-gray-400">
                        {p.method}
                      </span>
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDateTime(p.paidAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-gray-100 p-4">
          {/* Eliminar crédito: SOLO el dueño. Separado a la izquierda para no
              confundirlo con el abono. */}
          {canDelete && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(sale)}
              className="mr-auto inline-flex items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <TrashIcon className="h-4 w-4" /> Eliminar
            </button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            variant="primary"
            onClick={submit}
            loading={saving}
            disabled={saving || saldo <= 0}
          >
            Registrar abono
          </Button>
        </div>
      </div>
    </div>
  );
}
