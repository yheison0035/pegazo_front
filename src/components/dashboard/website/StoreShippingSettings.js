'use client';

import { useEffect, useState } from 'react';
import {
  TruckIcon,
  HomeModernIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { getStoreShipping, updateStoreShipping } from '@/lib/api/routes/company';

// Métodos con tarifa (envío/domicilio) y solo-toggle (recoger/mesa).
const METHODS = [
  { key: 'shipping', label: 'Envío nacional', sub: 'Por transportadora a todo el país.', icon: TruckIcon, fee: true },
  { key: 'local_delivery', label: 'Domicilio local', sub: 'Entrega en tu ciudad/zona.', icon: HomeModernIcon, fee: true },
  { key: 'pickup', label: 'Recoger en tienda', sub: 'El cliente recoge en tu local.', icon: BuildingStorefrontIcon, fee: false },
  { key: 'dine_in', label: 'En el local / mesa', sub: 'Consumo en el sitio.', icon: MapPinIcon, fee: false },
];

const EMPTY = {
  shipping: { enabled: false, fee: 0, freeFrom: '' },
  local_delivery: { enabled: false, fee: 0, freeFrom: '' },
  pickup: { enabled: false },
  dine_in: { enabled: false },
};

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-none items-center rounded-full transition ${
        checked ? 'bg-orange-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export default function StoreShippingSettings() {
  const [cfg, setCfg] = useState(null);
  const [configured, setConfigured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getStoreShipping()
      .then((r) => {
        const s = r?.data?.storeShipping;
        if (s) {
          setConfigured(true);
          setCfg({
            shipping: { enabled: !!s.shipping?.enabled, fee: s.shipping?.fee ?? 0, freeFrom: s.shipping?.freeFrom ?? '' },
            local_delivery: { enabled: !!s.local_delivery?.enabled, fee: s.local_delivery?.fee ?? 0, freeFrom: s.local_delivery?.freeFrom ?? '' },
            pickup: { enabled: !!s.pickup?.enabled },
            dine_in: { enabled: !!s.dine_in?.enabled },
          });
        } else {
          setCfg(EMPTY);
        }
      })
      .catch(() => setCfg(EMPTY));
  }, []);

  const set = (k, patch) => setCfg((c) => ({ ...c, [k]: { ...c[k], ...patch } }));

  const anyEnabled = cfg && METHODS.some((m) => cfg[m.key]?.enabled);

  const save = async () => {
    if (!anyEnabled) {
      setMsg('Activa al menos un método de envío/entrega.');
      return;
    }
    setSaving(true);
    setMsg('');
    try {
      const payload = {
        shipping: { enabled: cfg.shipping.enabled, fee: Number(cfg.shipping.fee) || 0, freeFrom: cfg.shipping.freeFrom === '' ? null : Number(cfg.shipping.freeFrom) },
        local_delivery: { enabled: cfg.local_delivery.enabled, fee: Number(cfg.local_delivery.fee) || 0, freeFrom: cfg.local_delivery.freeFrom === '' ? null : Number(cfg.local_delivery.freeFrom) },
        pickup: { enabled: cfg.pickup.enabled },
        dine_in: { enabled: cfg.dine_in.enabled },
      };
      const r = await updateStoreShipping(payload);
      if (r?.success) {
        setConfigured(true);
        setMsg('Guardado. En tu tienda se mostrarán solo los métodos activados.');
      }
    } catch (e) {
      setMsg(e?.message || 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  if (!cfg) return null;

  const money = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none';

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-gray-800">Métodos y tarifas de envío</h2>
      <p className="mb-4 text-sm text-gray-500">
        Activa los métodos de entrega de tu tienda y ponles su tarifa. Al guardar,
        el cliente verá <b>solo</b> los que actives aquí.
      </p>

      {!configured && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Hoy tu tienda usa la configuración automática por tipo de negocio.
          Personaliza los envíos activando los métodos y guardando.
        </div>
      )}

      <div className="space-y-2.5">
        {METHODS.map(({ key, label, sub, icon: Icon, fee }) => (
          <div key={key} className="rounded-xl border border-gray-100 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{label}</p>
                  <p className="text-xs text-gray-500">{sub}</p>
                </div>
              </div>
              <Toggle checked={!!cfg[key].enabled} onChange={(v) => set(key, { enabled: v })} />
            </div>

            {fee && cfg[key].enabled && (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium text-gray-600">
                  Tarifa (COP)
                  <input
                    type="number"
                    min="0"
                    value={cfg[key].fee}
                    onChange={(e) => set(key, { fee: e.target.value })}
                    className={`mt-1 ${money}`}
                    placeholder="Ej: 8000"
                  />
                </label>
                <label className="text-xs font-medium text-gray-600">
                  Envío gratis desde (opcional)
                  <input
                    type="number"
                    min="0"
                    value={cfg[key].freeFrom}
                    onChange={(e) => set(key, { freeFrom: e.target.value })}
                    className={`mt-1 ${money}`}
                    placeholder="Ej: 100000"
                  />
                </label>
              </div>
            )}
          </div>
        ))}
      </div>

      {msg && <p className="mt-3 text-xs text-gray-500">{msg}</p>}

      <div className="mt-4">
        <Button onClick={save} loading={saving} disabled={saving} variant="primary">
          {saving ? 'Guardando…' : 'Guardar envíos'}
        </Button>
      </div>
    </div>
  );
}
