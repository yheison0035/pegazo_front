'use client';

import { useCallback, useEffect, useState } from 'react';
import RoleGuard from '@/auth/roleGuard';
import { useToast } from '@/context/toastContext';
import { BanknotesIcon } from '@heroicons/react/24/outline';
import {
  getPlatformPaymentSettings,
  updatePlatformPaymentSettings,
} from '@/lib/api/routes/platformPayment';

const EMPTY = {
  bankName: '',
  accountType: 'AHORROS',
  accountNumber: '',
  accountHolder: '',
  whatsappNumber: '',
  instructions: '',
};

function PaymentAccountsInner() {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getPlatformPaymentSettings();
      setForm({
        bankName: data?.bankName || '',
        accountType: data?.accountType || 'AHORROS',
        accountNumber: data?.accountNumber || '',
        accountHolder: data?.accountHolder || '',
        whatsappNumber: data?.whatsappNumber || '',
        instructions: data?.instructions || '',
      });
    } catch (e) {
      toast.show({ type: 'error', message: e.message || 'Error al cargar' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      await updatePlatformPaymentSettings(form);
      toast.show({ type: 'success', message: 'Cuentas de pago actualizadas.' });
    } catch (e) {
      toast.show({ type: 'error', message: e.message || 'No se pudo guardar' });
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400';
  const labelCls = 'mb-1 block text-xs font-semibold text-gray-600';

  return (
    <div className="mx-auto mt-6 max-w-2xl">
      <div className="mb-1 flex items-center gap-2">
        <BanknotesIcon className="h-7 w-7 text-orange-500" />
        <h1 className="text-2xl font-bold text-gray-800">Cuentas de pago</h1>
      </div>
      <p className="mb-6 text-sm text-gray-500">
        Estos datos alimentan el botón “Pagar” que ven los negocios: a qué cuenta
        consignar y a qué WhatsApp enviar el comprobante.
      </p>

      {loading ? (
        <div className="py-16 text-center text-gray-400">Cargando…</div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Banco</label>
              <input value={form.bankName} onChange={set('bankName')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Tipo de cuenta</label>
              <select
                value={form.accountType}
                onChange={set('accountType')}
                className={inputCls}
              >
                <option value="AHORROS">Ahorros</option>
                <option value="CORRIENTE">Corriente</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Número de cuenta</label>
            <input
              value={form.accountNumber}
              onChange={set('accountNumber')}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Titular</label>
            <input
              value={form.accountHolder}
              onChange={set('accountHolder')}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>
              WhatsApp para comprobante (con indicativo, solo dígitos)
            </label>
            <input
              value={form.whatsappNumber}
              onChange={set('whatsappNumber')}
              placeholder="573186356609 o 3186356609"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Instrucciones (opcional)</label>
            <textarea
              rows={3}
              value={form.instructions}
              onChange={set('instructions')}
              placeholder="Texto que verá el negocio en la columna del comprobante."
              className={`${inputCls} resize-none`}
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaymentAccountsPage() {
  return (
    <RoleGuard allowedRoles={['SUPER_PLATFORM_ADMIN']}>
      <PaymentAccountsInner />
    </RoleGuard>
  );
}
