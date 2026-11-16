'use client';

import { useEffect, useState } from 'react';
import { BanknotesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import MoneyInput from '@/components/ui/MoneyInput';
import Button from '@/components/ui/Button';

// Atajo "Salida de efectivo": registra un GASTO en EFECTIVO pidiendo SOLO el
// valor y una descripción (en qué se gastó). Al ser en efectivo, se descuenta del
// esperado de la caja y queda en la lista de Gastos. Se carga en la SEDE
// seleccionada (el dueño ve todo separado por sede). Es un atajo para quienes no
// saben llenar el formulario completo de Gastos; ese formulario se conserva.
export default function CashOutModal({
  open,
  onClose,
  onSubmit,
  locals = [],
  defaultLocalId = '',
}) {
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [localId, setLocalId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Al abrir: limpia y preselecciona la sede (la activa del selector global, o la
  // única accesible si solo hay una).
  useEffect(() => {
    if (!open) return;
    setAmount('');
    setConcept('');
    setError('');
    setSubmitting(false);
    setLocalId(
      defaultLocalId
        ? String(defaultLocalId)
        : locals.length === 1
          ? String(locals[0].id)
          : '',
    );
  }, [open, defaultLocalId, locals]);

  if (!open) return null;

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!localId) return setError('Elige la sede.');
    if (!amount || Number(amount) <= 0) return setError('Ingresa el valor gastado.');
    if (!concept.trim()) return setError('Describe en qué se gastó.');
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        localId: Number(localId),
        amount: Number(amount),
        concept: concept.trim(),
      });
      onClose();
    } catch (err) {
      setError(err?.message || 'No se pudo registrar la salida de efectivo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between bg-orange-600 px-5 py-4 text-white">
          <div className="flex items-center gap-2">
            <BanknotesIcon className="h-6 w-6" />
            <h2 className="text-lg font-bold">Salida de efectivo</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-1 transition hover:bg-white/15"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <p className="text-sm text-gray-500">
            Dinero que salió de la caja. Solo el valor y en qué se gastó: se
            descuenta de la caja de la sede y queda registrado en Gastos.
          </p>

          {locals.length > 1 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Sede</label>
              <select
                name="salida_localId"
                value={localId}
                onChange={(e) => setLocalId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
              >
                <option value="">Selecciona la sede…</option>
                {locals.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Valor</label>
            <MoneyInput
              name="salida_amount"
              value={amount}
              onChange={setAmount}
              placeholder="$ 0"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              ¿En qué se gastó?
            </label>
            <input
              name="salida_concept"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Ej: almuerzo, taxi, insumos de aseo…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
            />
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={submitting}>
              Registrar salida
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
