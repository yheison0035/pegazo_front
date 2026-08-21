'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { getSalePayments, addSalePayment } from '@/lib/api/routes/sales';
import { formatCOP, formatDateTime } from '@/lib/api/utils/utils';
import Button from '@/components/ui/Button';

const METHODS = [
  { id: 'EFECTIVO', name: 'Efectivo' },
  { id: 'BANCOLOMBIA', name: 'Bancolombia' },
  { id: 'TRANSFERENCIA', name: 'Transferencia' },
  { id: 'DATAFONO', name: 'Datáfono' },
];

// Parseo/format de dinero mientras se escribe (miles con puntos).
const parseMoney = (s) => Number(String(s).replace(/[^\d]/g, '')) || 0;

export default function AbonoModal({ sale, onClose, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('EFECTIVO');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await getSalePayments(sale.id);
      setData(res?.data || null);
    } catch (e) {
      setError(e?.message || 'No se pudo cargar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sale.id]);

  const saldo = data?.saldo ?? sale.saldo ?? 0;

  const submit = async () => {
    const value = parseMoney(amount);
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

          {/* Formulario de abono */}
          <label className="text-xs font-medium text-gray-500">Monto a abonar</label>
          <input
            autoFocus
            inputMode="numeric"
            value={amount ? formatCOP(parseMoney(amount)) : ''}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="$ 0"
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <div className="mt-2 flex gap-2">
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

        <div className="flex gap-2 border-t border-gray-100 p-4">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cerrar
          </Button>
          <Button
            variant="primary"
            onClick={submit}
            loading={saving}
            disabled={saving || saldo <= 0}
            className="flex-1"
          >
            Registrar abono
          </Button>
        </div>
      </div>
    </div>
  );
}
