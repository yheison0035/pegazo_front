'use client';

import { useEffect, useState } from 'react';
import {
  TruckIcon,
  HomeModernIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
  PlusIcon,
  TrashIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { getStoreShipping, updateStoreShipping } from '@/lib/api/routes/company';
import { locations } from '@/lib/api/utils/locations.data';
import { formatCOP } from '@/lib/api/utils/utils';

const DEPARTMENTS = locations.map((l) => l.department);

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

// Zonas apartadas de Colombia: la mayoría de tiendas les cobra un recargo y da
// tiempos más largos. (Nombres iguales a locations.data para que coincidan.)
const APARTADOS = [
  'Amazonas',
  'Guainía',
  'Vaupés',
  'Vichada',
  'Guaviare',
  'Chocó',
  'Putumayo',
  'Caquetá',
  'Arauca',
  'San Andrés y Providencia',
];

// Catálogo de transportadoras de CONTRA ENTREGA en Colombia, con el formato que
// usan las tiendas: tarifa nacional plana + recargo para zonas apartadas, y los
// TIEMPOS reales publicados por cada una. Los COSTOS son estimados de mercado y
// se dejan EDITABLES (cada quien ajusta a su contrato para no perder dinero).
const CARRIER_SEED = [
  { id: 'interrapidisimo', name: 'Interrapidísimo', nal: 13000, nalDays: '1 a 3 días hábiles', apCost: 22000, apDays: '3 a 6 días hábiles' },
  { id: 'servientrega', name: 'Servientrega', nal: 15000, nalDays: '1 a 3 días hábiles', apCost: 26000, apDays: '3 a 6 días hábiles' },
  { id: 'coordinadora', name: 'Coordinadora', nal: 14500, nalDays: '1 a 4 días hábiles', apCost: 25000, apDays: '4 a 7 días hábiles' },
  { id: 'envia', name: 'Envía', nal: 13500, nalDays: '1 a 4 días hábiles', apCost: 23000, apDays: '4 a 7 días hábiles' },
  { id: 'tcc', name: 'TCC', nal: 14000, nalDays: '1 a 4 días hábiles', apCost: 24000, apDays: '3 a 6 días hábiles' },
];

// Genera las transportadoras sugeridas. Solo la primera (la que ya usas) queda
// ACTIVA por defecto; las demás cargadas pero apagadas para que actives las que
// tengas contrato.
function suggestedCarriers() {
  return CARRIER_SEED.map((c, i) => ({
    id: c.id,
    name: c.name,
    logo: '',
    enabled: i === 0,
    cod: true,
    national: { cost: c.nal, days: c.nalDays },
    overrides: APARTADOS.map((d) => ({ department: d, cost: c.apCost, days: c.apDays })),
  }));
}

const newCarrier = () => ({
  id: `carrier-${Date.now()}`,
  name: '',
  logo: '',
  enabled: true,
  cod: true,
  national: { cost: 0, days: '' },
  overrides: [],
});

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

const input =
  'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none';

// Campo de PRECIO con el MISMO formato del resto del CRM (inventario, etc.):
// muestra el valor como moneda ($ 15.000) y guarda solo el número.
// allowEmpty = deja el campo vacío (para "envío gratis desde" opcional).
function MoneyInput({ value, onChange, placeholder, allowEmpty = false, className }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value === '' || value == null ? '' : formatCOP(value)}
      onChange={(e) => {
        const digits = String(e.target.value).replace(/\D/g, '');
        if (digits === '') return onChange(allowEmpty ? '' : 0);
        onChange(Number(digits));
      }}
      placeholder={placeholder}
      className={className || `mt-1 ${input}`}
    />
  );
}

export default function StoreShippingSettings() {
  const [cfg, setCfg] = useState(null);
  const [carriers, setCarriers] = useState([]);
  const [freeFrom, setFreeFrom] = useState('');
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
          setFreeFrom(s.freeFrom ?? s.shipping?.freeFrom ?? '');
          setCarriers(
            Array.isArray(s.carriers) && s.carriers.length
              ? s.carriers.map((c) => ({
                  id: c.id || `carrier-${Math.random().toString(36).slice(2)}`,
                  name: c.name || '',
                  logo: c.logo || '',
                  enabled: c.enabled !== false,
                  cod: c.cod !== false,
                  national: { cost: c.national?.cost ?? 0, days: c.national?.days || '' },
                  overrides: Array.isArray(c.overrides)
                    ? c.overrides.map((o) => ({ department: o.department || '', cost: o.cost ?? 0, days: o.days || '' }))
                    : [],
                }))
              : suggestedCarriers(),
          );
        } else {
          setCfg(EMPTY);
          setCarriers(suggestedCarriers());
        }
      })
      .catch(() => {
        setCfg(EMPTY);
        setCarriers(suggestedCarriers());
      });
  }, []);

  const set = (k, patch) => setCfg((c) => ({ ...c, [k]: { ...c[k], ...patch } }));

  // ---- Operaciones sobre transportadoras ----
  const updateCarrier = (i, patch) =>
    setCarriers((cs) => cs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const updateNational = (i, patch) =>
    setCarriers((cs) => cs.map((c, idx) => (idx === i ? { ...c, national: { ...c.national, ...patch } } : c)));
  const addCarrier = () => setCarriers((cs) => [...cs, newCarrier()]);
  const removeCarrier = (i) => setCarriers((cs) => cs.filter((_, idx) => idx !== i));
  const addOverride = (i) =>
    setCarriers((cs) => cs.map((c, idx) => (idx === i ? { ...c, overrides: [...c.overrides, { department: '', cost: 0, days: '' }] } : c)));
  const updateOverride = (i, oi, patch) =>
    setCarriers((cs) =>
      cs.map((c, idx) =>
        idx === i ? { ...c, overrides: c.overrides.map((o, oidx) => (oidx === oi ? { ...o, ...patch } : o)) } : c,
      ),
    );
  const removeOverride = (i, oi) =>
    setCarriers((cs) => cs.map((c, idx) => (idx === i ? { ...c, overrides: c.overrides.filter((_, oidx) => oidx !== oi) } : c)));

  // Agrega las transportadoras sugeridas que aún no estén en la lista (por id).
  const loadSuggested = () =>
    setCarriers((cs) => {
      const have = new Set(cs.map((c) => c.id));
      const toAdd = suggestedCarriers().filter((c) => !have.has(c.id));
      return [...cs, ...toAdd];
    });

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
        freeFrom: freeFrom === '' ? null : Number(freeFrom),
        carriers: carriers.map((c) => ({
          id: c.id,
          name: c.name,
          logo: c.logo || null,
          enabled: c.enabled,
          cod: c.cod,
          national: { cost: Number(c.national.cost) || 0, days: c.national.days || null },
          overrides: c.overrides
            .filter((o) => o.department)
            .map((o) => ({ department: o.department, cost: Number(o.cost) || 0, days: o.days || null })),
        })),
      };
      const r = await updateStoreShipping(payload);
      if (r?.success) {
        setConfigured(true);
        setMsg('Guardado. En tu tienda se mostrarán los métodos y transportadoras activados.');
      }
    } catch (e) {
      setMsg(e?.message || 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  if (!cfg) return null;

  return (
    <div className="space-y-5">
      {/* Métodos de entrega */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-800">Métodos de entrega</h2>
        <p className="mb-4 text-sm text-gray-500">
          Activa los métodos de tu tienda. Al guardar, el cliente verá <b>solo</b> los que actives.
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

              {key === 'shipping' && cfg.shipping.enabled && (
                <p className="mt-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs text-blue-700">
                  El costo del envío nacional se toma de las <b>Transportadoras</b> de abajo
                  (por destino). La tarifa fija de aquí solo se usa si no hay transportadoras.
                </p>
              )}

              {fee && cfg[key].enabled && (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="text-xs font-medium text-gray-600">
                    {key === 'shipping' ? 'Tarifa fija (respaldo)' : 'Tarifa'}
                    <MoneyInput value={cfg[key].fee} onChange={(v) => set(key, { fee: v })} placeholder="Ej: $ 8.000" />
                  </label>
                  {/* El "envío gratis desde" del envío nacional se define UNA sola vez
                      abajo (global de transportadoras). Aquí solo para domicilio local. */}
                  {key !== 'shipping' && (
                    <label className="text-xs font-medium text-gray-600">
                      Envío gratis desde (opcional)
                      <MoneyInput value={cfg[key].freeFrom} onChange={(v) => set(key, { freeFrom: v })} placeholder="Ej: $ 100.000" allowEmpty />
                    </label>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Transportadoras */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-800">Transportadoras (envío / contra entrega)</h2>
            <p className="text-sm text-gray-500">
              Define tarifas y <b>tiempos de entrega</b> por destino. El cliente los verá al elegir su ciudad.
            </p>
          </div>
          <div className="flex flex-none gap-2">
            <Button onClick={loadSuggested} variant="secondary">
              Cargar sugeridas
            </Button>
            <Button onClick={addCarrier} variant="secondary">
              <PlusIcon className="mr-1 h-4 w-4" /> Agregar
            </Button>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <b>Importante:</b> las tarifas cargadas son <b>estimados de mercado, editables</b>. La contra
          entrega cobra <b>flete + comisión de recaudo</b> (≈ 1% a 4,3% del valor recaudado, con un
          mínimo por envío). Ajusta cada tarifa a tu contrato para <b>no perder dinero</b>. Deja
          activas solo las transportadoras con las que tengas convenio.
        </div>

        {/* Envío gratis global */}
        <label className="mt-4 block max-w-xs text-xs font-medium text-gray-600">
          Envío gratis desde (global)
          <MoneyInput value={freeFrom} onChange={setFreeFrom} placeholder="Ej: $ 150.000" allowEmpty />
          <span className="mt-1 block text-[11px] font-normal text-gray-400">
            Si el pedido alcanza este valor, el envío es gratis en cualquier transportadora.
          </span>
        </label>

        <div className="mt-4 space-y-4">
          {carriers.length === 0 && (
            <p className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
              Sin transportadoras. Agrega una para cobrar y mostrar tiempos por destino.
            </p>
          )}

          {carriers.map((c, i) => (
            <div
              key={c.id}
              className={`rounded-2xl border p-4 ${
                c.enabled ? 'border-gray-200' : 'border-gray-100 bg-gray-50/60'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <TruckIcon
                    className={`h-5 w-5 ${
                      c.enabled ? 'text-orange-500' : 'text-gray-400'
                    }`}
                  />
                  {c.enabled ? (
                    <input
                      value={c.name}
                      onChange={(e) => updateCarrier(i, { name: e.target.value })}
                      placeholder="Nombre (ej: Interrapidísimo)"
                      className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm font-semibold focus:border-orange-400 focus:outline-none"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-gray-500">
                      {c.name || 'Transportadora'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-gray-600">
                    Activa <Toggle checked={c.enabled} onChange={(v) => updateCarrier(i, { enabled: v })} />
                  </label>
                  <button onClick={() => removeCarrier(i)} title="Eliminar" className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {c.enabled && (
                <>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium text-gray-600">
                  Tarifa nacional
                  <MoneyInput value={c.national.cost} onChange={(v) => updateNational(i, { cost: v })} placeholder="Ej: $ 15.000" />
                </label>
                <label className="text-xs font-medium text-gray-600">
                  Tiempo de entrega nacional
                  <input value={c.national.days} onChange={(e) => updateNational(i, { days: e.target.value })} className={`mt-1 ${input}`} placeholder="Ej: 3 a 5 días hábiles" />
                </label>
              </div>

              <label className="mt-3 flex items-center gap-2 text-xs font-medium text-gray-600">
                <BanknotesIcon className="h-4 w-4 text-green-600" />
                Acepta pago contra entrega
                <Toggle checked={c.cod} onChange={(v) => updateCarrier(i, { cod: v })} />
              </label>

              <label className="mt-3 block text-xs font-medium text-gray-600">
                Logo (URL, opcional)
                <input value={c.logo} onChange={(e) => updateCarrier(i, { logo: e.target.value })} className={`mt-1 ${input}`} placeholder="https://…" />
              </label>

              {/* Overrides por departamento */}
              <div className="mt-4 rounded-xl bg-gray-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-700">Tarifas por departamento (opcional)</p>
                  <button onClick={() => addOverride(i)} className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-orange-600 shadow-sm hover:bg-orange-50">
                    <PlusIcon className="h-3.5 w-3.5" /> Agregar zona
                  </button>
                </div>
                {c.overrides.length === 0 ? (
                  <p className="text-[11px] text-gray-400">Sin overrides: todos los destinos usan la tarifa nacional.</p>
                ) : (
                  <div className="space-y-2">
                    {c.overrides.map((o, oi) => (
                      <div key={oi} className="grid grid-cols-1 gap-2 sm:grid-cols-[1.2fr_0.8fr_1.2fr_auto]">
                        <select value={o.department} onChange={(e) => updateOverride(i, oi, { department: e.target.value })} className={input}>
                          <option value="">Departamento…</option>
                          {DEPARTMENTS.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                        <MoneyInput value={o.cost} onChange={(v) => updateOverride(i, oi, { cost: v })} placeholder="Costo" className={input} />
                        <input value={o.days} onChange={(e) => updateOverride(i, oi, { days: e.target.value })} className={input} placeholder="Tiempo (ej: 1 a 2 días)" />
                        <button onClick={() => removeOverride(i, oi)} className="flex items-center justify-center rounded-lg px-2 text-gray-400 hover:bg-red-50 hover:text-red-500">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-gray-200 bg-white/95 py-3 backdrop-blur">
        {msg && <p className="mr-auto text-xs text-gray-500">{msg}</p>}
        <Button onClick={save} loading={saving} disabled={saving} variant="primary">
          {saving ? 'Guardando…' : 'Guardar envíos'}
        </Button>
      </div>
    </div>
  );
}
