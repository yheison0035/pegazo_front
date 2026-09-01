'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Squares2X2Icon,
  PencilSquareIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

import RoleGuard from '@/auth/roleGuard';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import Button from '@/components/ui/Button';
import TableActionButton from '@/components/ui/TableActionButton';
import { MODULE_GROUPS } from '@/config/modules';
import { getProductFields } from '@/config/verticalProfiles';
import { assignableRolesForType } from '@/config/roleLabels';
import {
  getBusinessTypes,
  updateBusinessType,
  createBusinessType,
} from '@/lib/api/routes/businessTypes';

const inputCls =
  'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20';

// Vocabulario editable por tipo (clave + etiqueta + valor por defecto).
const TERM_FIELDS = [
  { key: 'product', label: 'Producto (singular)', def: 'Producto' },
  { key: 'productPlural', label: 'Productos (plural)', def: 'Productos' },
  { key: 'customer', label: 'Cliente (singular)', def: 'Cliente' },
  { key: 'customerPlural', label: 'Clientes (plural)', def: 'Clientes' },
  { key: 'sale', label: 'Venta (singular)', def: 'Venta' },
  { key: 'salePlural', label: 'Ventas (plural)', def: 'Ventas' },
  { key: 'attendant', label: 'Vendedor (singular)', def: 'Vendedor' },
  { key: 'attendantPlural', label: 'Vendedores (plural)', def: 'Vendedores' },
  { key: 'service', label: 'Servicio (singular)', def: 'Servicio' },
  { key: 'servicePlural', label: 'Servicios (plural)', def: 'Servicios' },
  { key: 'appointment', label: 'Cita (singular)', def: 'Cita' },
  { key: 'appointmentPlural', label: 'Citas (plural)', def: 'Citas' },
  { key: 'catalogLabel', label: 'Catálogo (menú/inventario)', def: '' },
];

// Campos de producto (booleanos) + tipo de variante.
const PF_BOOLS = [
  { key: 'brand', label: 'Marca' },
  { key: 'provider', label: 'Proveedor' },
  { key: 'barcode', label: 'Código de barras' },
  { key: 'category', label: 'Categoría' },
  { key: 'oldPrice', label: 'Precio anterior (tachado)' },
  { key: 'size', label: 'Talla' },
  { key: 'expiry', label: 'Vencimiento' },
];
const PF_DEFAULTS = {
  brand: true,
  provider: true,
  barcode: true,
  category: true,
  oldPrice: true,
  size: false,
  expiry: false,
  variantType: 'simple',
};
const VARIANT_OPTIONS = [
  { id: 'simple', name: 'Simple' },
  { id: 'color', name: 'Color / Talla' },
  { id: 'weight', name: 'Peso (kg)' },
];

const FULFILLMENT_OPTIONS = [
  { id: 'shipping', label: 'Envío nacional (transportadora)' },
  { id: 'local_delivery', label: 'Domicilio local' },
  { id: 'pickup', label: 'Recoger en tienda' },
  { id: 'dine_in', label: 'Consumo en mesa' },
];
const LAYOUT_OPTIONS = [
  { id: '', name: 'Por defecto' },
  { id: 'grid', name: 'Cuadrícula (retail)' },
  { id: 'menu', name: 'Menú (comida)' },
];

const TYPE_ROLES = [
  'ADMIN',
  'COORDINADOR',
  'ASESOR',
  'AUXILIAR',
  'BODEGUERO',
  'CAJA',
  'RECEPCIONISTA',
  'BARBERO',
  'PROFESIONAL',
  'MESERO',
  'COCINERO',
];

function Editor({ item, onClose, onSaved }) {
  const isNew = !!item.__new;
  const [label, setLabel] = useState(item.label || '');
  const [typeKey, setTypeKey] = useState(item.type || '');
  const [active, setActive] = useState(item.active ?? true);
  const [mods, setMods] = useState(new Set(item.modules || []));
  const [terms, setTerms] = useState(item.terminology || {});
  // Campos de producto y roles: si el tipo aún no los tiene configurados en BD,
  // se precargan con la config efectiva del código (evita clobber de tipos base
  // como FRUVER=peso) y deja verlos/ajustarlos.
  const [pf, setPf] = useState(
    item.productFields || getProductFields(item.type || ''),
  );
  const [roles, setRoles] = useState(
    new Set(
      item.roles && item.roles.length
        ? item.roles
        : assignableRolesForType(item.type || ''),
    ),
  );
  const [defs, setDefs] = useState(item.defaults || {});
  const setDef = (k, v) => setDefs((prev) => ({ ...prev, [k]: v }));
  const [ful, setFul] = useState(new Set(item.storefront?.fulfillment || []));
  const [sfLayout, setSfLayout] = useState(item.storefront?.layout || '');
  const toggleFul = (key) =>
    setFul((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const toggle = (key) =>
    setMods((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  const toggleRole = (key) =>
    setRoles((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  const pfVal = (k) => (pf[k] !== undefined ? pf[k] : PF_DEFAULTS[k]);
  const setPfVal = (k, v) => setPf((prev) => ({ ...prev, [k]: v }));

  const save = async () => {
    if (!label.trim()) {
      setErr('El nombre es obligatorio.');
      return;
    }
    setSaving(true);
    setErr('');
    // Vocabulario: solo las claves con valor (lo vacío usa el default).
    const terminology = Object.fromEntries(
      Object.entries(terms).filter(([, v]) => String(v || '').trim()),
    );
    // Campos de producto: se envía el set completo resuelto (con defaults).
    const productFields = {
      ...PF_DEFAULTS,
      ...pf,
    };
    // Defaults: solo las claves con valor definido.
    const defaults = Object.fromEntries(
      Object.entries(defs).filter(
        ([, v]) => v !== '' && v !== undefined && v !== null,
      ),
    );
    // Tienda online: modos de entrega + layout.
    const storefront = {};
    if (ful.size) storefront.fulfillment = [...ful];
    if (sfLayout) storefront.layout = sfLayout;
    const payloadExtra = {
      terminology: Object.keys(terminology).length ? terminology : null,
      productFields,
      roles: [...roles],
      defaults: Object.keys(defaults).length ? defaults : null,
      storefront: Object.keys(storefront).length ? storefront : null,
    };
    try {
      if (isNew) {
        await createBusinessType({
          label: label.trim(),
          type: typeKey.trim() || undefined,
          modules: [...mods],
          ...payloadExtra,
        });
      } else {
        await updateBusinessType(item.type, {
          label: label.trim() || item.type,
          modules: [...mods],
          active,
          ...payloadExtra,
        });
      }
      onSaved();
    } catch (e) {
      setErr(e?.message || 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-800">
          {isNew ? 'Nuevo tipo de negocio' : `Tipo de negocio: ${item.type}`}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {isNew
            ? 'Crea un tipo de negocio nuevo y marca los módulos que traerá por defecto.'
            : 'Ajusta el nombre visible y qué módulos ve por defecto este tipo de negocio. (El override por empresa sigue mandando sobre esto.)'}
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Nombre visible
            </label>
            <input
              className={inputCls}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ej: Ferretería"
            />
          </div>
          {isNew ? (
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Clave (opcional)
              </label>
              <input
                className={inputCls}
                value={typeKey}
                onChange={(e) => setTypeKey(e.target.value)}
                placeholder="Se genera del nombre (FERRETERIA)"
              />
            </div>
          ) : (
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-orange-500"
              />
              Activo (usa esta configuración)
            </label>
          )}
        </div>

        <p className="mt-6 mb-2 text-sm font-semibold text-gray-800">Módulos</p>
        <div className="space-y-4">
          {Object.entries(MODULE_GROUPS).map(([group, list]) => (
            <div key={group}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {group}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((m) => (
                  <label
                    key={m.key}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={mods.has(m.key)}
                      onChange={() => toggle(m.key)}
                      className="h-4 w-4 cursor-pointer accent-orange-500"
                    />
                    <span className="text-gray-700">{m.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Vocabulario */}
        <p className="mt-6 mb-1 text-sm font-semibold text-gray-800">
          Vocabulario
        </p>
        <p className="mb-3 text-xs text-gray-400">
          Cómo se llaman las cosas en este tipo de negocio. Vacío = usa el
          nombre por defecto.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TERM_FIELDS.map((tf) => (
            <div key={tf.key}>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                {tf.label}
              </label>
              <input
                className={inputCls}
                value={terms[tf.key] || ''}
                placeholder={tf.def || '—'}
                onChange={(e) =>
                  setTerms((prev) => ({ ...prev, [tf.key]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>

        {/* Campos de producto */}
        <p className="mt-6 mb-1 text-sm font-semibold text-gray-800">
          Campos de producto
        </p>
        <p className="mb-3 text-xs text-gray-400">
          Qué datos maneja el producto de este tipo de negocio.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PF_BOOLS.map((b) => (
            <label
              key={b.key}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={!!pfVal(b.key)}
                onChange={(e) => setPfVal(b.key, e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-orange-500"
              />
              <span className="text-gray-700">{b.label}</span>
            </label>
          ))}
        </div>
        <div className="mt-3 max-w-xs">
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Tipo de variante
          </label>
          <select
            className={inputCls}
            value={pfVal('variantType')}
            onChange={(e) => setPfVal('variantType', e.target.value)}
          >
            {VARIANT_OPTIONS.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* Roles */}
        <p className="mt-6 mb-1 text-sm font-semibold text-gray-800">Roles</p>
        <p className="mb-3 text-xs text-gray-400">
          Roles que se pueden asignar a los usuarios de este tipo de negocio.
          Vacío = usa los roles por defecto.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {TYPE_ROLES.map((r) => (
            <label
              key={r}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={roles.has(r)}
                onChange={() => toggleRole(r)}
                className="h-4 w-4 cursor-pointer accent-orange-500"
              />
              <span className="text-gray-700">{r}</span>
            </label>
          ))}
        </div>

        {/* Valores por defecto */}
        <p className="mt-6 mb-1 text-sm font-semibold text-gray-800">
          Valores por defecto
        </p>
        <p className="mb-3 text-xs text-gray-400">
          Se aplican al crear una empresa de este tipo. El dueño los puede
          cambiar luego en su configuración.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm hover:bg-gray-50">
            <input
              type="checkbox"
              checked={!!defs.requireCashOpen}
              onChange={(e) => setDef('requireCashOpen', e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-orange-500"
            />
            <span className="text-gray-700">Exigir abrir caja para vender</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm hover:bg-gray-50">
            <input
              type="checkbox"
              checked={!!defs.loyaltyEnabled}
              onChange={(e) => setDef('loyaltyEnabled', e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-orange-500"
            />
            <span className="text-gray-700">Fidelización activada</span>
          </label>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Hora de apertura (0–23)
            </label>
            <input
              type="number"
              min="0"
              max="23"
              className={inputCls}
              value={defs.openHour ?? ''}
              onChange={(e) =>
                setDef(
                  'openHour',
                  e.target.value === '' ? '' : Number(e.target.value),
                )
              }
              placeholder="9"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Hora de cierre (0–23)
            </label>
            <input
              type="number"
              min="0"
              max="23"
              className={inputCls}
              value={defs.closeHour ?? ''}
              onChange={(e) =>
                setDef(
                  'closeHour',
                  e.target.value === '' ? '' : Number(e.target.value),
                )
              }
              placeholder="20"
            />
          </div>
        </div>

        {/* Tienda online */}
        <p className="mt-6 mb-1 text-sm font-semibold text-gray-800">
          Tienda online
        </p>
        <p className="mb-3 text-xs text-gray-400">
          Cómo entrega y se ve el catálogo de la tienda para este tipo de
          negocio. Vacío = usa el comportamiento por defecto.
        </p>
        <p className="mb-2 text-xs font-medium text-gray-500">Modos de entrega</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {FULFILLMENT_OPTIONS.map((f) => (
            <label
              key={f.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={ful.has(f.id)}
                onChange={() => toggleFul(f.id)}
                className="h-4 w-4 cursor-pointer accent-orange-500"
              />
              <span className="text-gray-700">{f.label}</span>
            </label>
          ))}
        </div>
        <div className="mt-3 max-w-xs">
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Diseño del catálogo
          </label>
          <select
            className={inputCls}
            value={sfLayout}
            onChange={(e) => setSfLayout(e.target.value)}
          >
            {LAYOUT_OPTIONS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" loading={saving} onClick={save}>
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PlatformBusinessTypes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBusinessTypes();
      setItems(res?.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <RoleGuard allowedRoles={['SUPER_PLATFORM_ADMIN']}>
      <div className="relative w-full p-4">
        <LoadingOverlay show={loading} text="Cargando tipos de negocio..." />

        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="mb-1 flex items-center gap-2 text-2xl font-semibold">
              <Squares2X2Icon className="h-6 w-6 text-orange-500" />
              Tipos de negocio
            </h1>
            <p className="text-sm text-gray-500">
              Configura el nombre y los módulos que trae cada tipo de negocio, o
              crea uno nuevo. Los cambios aplican a todos los negocios de ese tipo
              (salvo que tengan módulos manuales por empresa).
            </p>
          </div>
          <Button variant="primary" onClick={() => setEditing({ __new: true })}>
            <PlusIcon className="mr-1 h-4 w-4" /> Nuevo tipo
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <div
              key={it.type}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{it.label}</h3>
                  <p className="text-xs text-gray-400">{it.type}</p>
                </div>
                <TableActionButton
                  icon={PencilSquareIcon}
                  label="Editar"
                  variant="edit"
                  onClick={() => setEditing(it)}
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    it.active
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {it.active ? 'Activo' : 'Inactivo'}
                </span>
                <span className="text-xs text-gray-500">
                  {it.modules?.length || 0} módulos
                </span>
              </div>
            </div>
          ))}
        </div>

        {editing && (
          <Editor
            item={editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              fetchData();
            }}
          />
        )}
      </div>
    </RoleGuard>
  );
}
