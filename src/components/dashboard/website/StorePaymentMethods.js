'use client';

import { useEffect, useState } from 'react';
import {
  CreditCardIcon,
  BanknotesIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { getStorePayments, updateStorePayments } from '@/lib/api/routes/company';

function Toggle({ checked, disabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-none items-center rounded-full transition ${
        checked ? 'bg-orange-500' : 'bg-gray-300'
      } disabled:opacity-40`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function Row({ icon: Icon, title, subtitle, right, warn }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-orange-50 text-orange-600">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800">{title}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
          {warn && <p className="mt-0.5 text-xs font-medium text-amber-600">{warn}</p>}
        </div>
      </div>
      <div className="flex-none">{right}</div>
    </div>
  );
}

// Métodos de pago que el dueño acepta en su tienda online. El cliente solo verá
// los que estén activados aquí. Se guarda al instante.
export default function StorePaymentMethods() {
  const [methods, setMethods] = useState(null);
  const [wompiReady, setWompiReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getStorePayments()
      .then((r) => {
        setWompiReady(!!r?.data?.wompiReady);
        const arr = r?.data?.storePaymentMethods;
        if (Array.isArray(arr) && arr.length > 0) {
          setMethods(arr);
        } else {
          // Sin configurar: por defecto contra entrega + pago en línea (igual que
          // se ve en la tienda). Lo PERSISTIMOS para que el estado sea explícito
          // y los toggles queden 100% sincronizados con la página.
          const def = ['COD', 'ONLINE'];
          setMethods(def);
          updateStorePayments(def).catch(() => {});
        }
      })
      .catch(() => setMethods(['COD', 'ONLINE']));
  }, []);

  const has = (m) => methods?.includes(m);
  const toggle = async (m) => {
    const next = has(m) ? methods.filter((x) => x !== m) : [...methods, m];
    const prev = methods;
    setMethods(next);
    setSaving(true);
    try {
      const r = await updateStorePayments(next);
      if (r?.data?.storePaymentMethods) setMethods(r.data.storePaymentMethods);
    } catch {
      setMethods(prev);
    } finally {
      setSaving(false);
    }
  };

  if (!methods) return null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-800">Métodos de pago de la tienda</h2>
        {saving && <span className="text-xs text-gray-400">Guardando…</span>}
      </div>
      <p className="mb-4 text-sm text-gray-500">
        Elige qué opciones de pago verá tu cliente en el checkout. Lo que
        actives aquí aparece en la tienda; lo que desactives, no. (Los cambios
        se ven al recargar la tienda.)
      </p>

      <div className="space-y-2.5">
        <Row
          icon={BanknotesIcon}
          title="Pago contra entrega"
          subtitle="El cliente paga cuando recibe el pedido."
          right={<Toggle checked={has('COD')} disabled={saving} onChange={() => toggle('COD')} />}
        />
        <Row
          icon={CreditCardIcon}
          title="Pago en línea (Wompi)"
          subtitle="Tarjeta, PSE, Nequi, Daviplata. El dinero cae en tu banco."
          warn={
            !wompiReady
              ? 'Conecta tu cuenta Wompi (abajo/arriba) para que aparezca en la tienda.'
              : null
          }
          right={<Toggle checked={has('ONLINE')} disabled={saving} onChange={() => toggle('ONLINE')} />}
        />
        <Row
          icon={ClockIcon}
          title="ADDI (financiación)"
          subtitle="Compra ahora y paga después."
          warn="Próximamente: requiere integración con ADDI."
          right={<Toggle checked={false} disabled onChange={() => {}} />}
        />
      </div>
    </div>
  );
}
