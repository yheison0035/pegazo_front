'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  PlusIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  ArrowsUpDownIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { useAuth } from '@/context/authContext';
import { formatCOP } from '@/lib/api/utils/utils';
import {
  getSupplies,
  createSupply,
  updateSupply,
  deleteSupply,
  adjustSupply,
} from '@/lib/api/routes/supplies';
import { getLocals } from '@/lib/api/routes/locals';
import { getProviders } from '@/lib/api/routes/providers';

const UNITS = [
  { id: 'UNIDAD', name: 'Unidad' },
  { id: 'KG', name: 'Kilogramo (kg)' },
  { id: 'GRAMO', name: 'Gramo (g)' },
  { id: 'LITRO', name: 'Litro (L)' },
  { id: 'ML', name: 'Mililitro (ml)' },
];
const unitLabel = (u) => UNITS.find((x) => x.id === u)?.name?.split(' ')[0] || u;

const ADJUST_TYPES = [
  { id: 'ENTRADA', name: 'Entrada (sumar)' },
  { id: 'SALIDA', name: 'Salida (restar)' },
  { id: 'AJUSTE', name: 'Ajuste (fijar)' },
];

const MANAGE_ROLES = ['SUPER_ADMIN', 'ADMIN'];

export default function Supplies() {
  const auth = useAuth();
  const usuario = auth?.usuario;
  const canManage = MANAGE_ROLES.includes(usuario?.role);

  const [supplies, setSupplies] = useState([]);
  const [locals, setLocals] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState({});

  const [form, setForm] = useState(null); // insumo en edición/creación
  const [adjust, setAdjust] = useState(null); // { supply, type, quantity, reason }

  const load = useCallback(async () => {
    try {
      const res = await getSupplies();
      setSupplies(res?.data || []);
    } catch {
      setSupplies([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
    getLocals({ all: true })
      .then((r) => setLocals(r?.data || []))
      .catch(() => setLocals([]));
    getProviders({ all: true })
      .then((r) => setProviders(r?.data || []))
      .catch(() => setProviders([]));
  }, [load]);

  const emptyForm = () => ({
    id: null,
    name: '',
    unit: 'UNIDAD',
    stock: '',
    minStock: '',
    cost: '',
    providerId: '',
    localId: String(usuario?.localId || locals[0]?.id || ''),
  });

  const openNew = () => setForm(emptyForm());
  const openEdit = (s) =>
    setForm({
      id: s.id,
      name: s.name,
      unit: s.unit,
      stock: s.stock,
      minStock: s.minStock ?? '',
      cost: s.cost ?? '',
      providerId: s.providerId ? String(s.providerId) : '',
      localId: String(s.localId),
    });

  const saveForm = async () => {
    if (!form.name.trim()) {
      return setAlert({ type: 'warning', message: 'Ponle un nombre al insumo.' });
    }
    setBusy(true);
    try {
      const base = {
        name: form.name.trim(),
        unit: form.unit,
        minStock: form.minStock === '' ? undefined : Number(form.minStock),
        cost: form.cost === '' ? undefined : Number(form.cost),
        providerId: form.providerId ? Number(form.providerId) : undefined,
      };
      if (form.id) {
        await updateSupply(form.id, base);
      } else {
        if (!form.localId) {
          setBusy(false);
          return setAlert({ type: 'warning', message: 'Elige una sede.' });
        }
        await createSupply({
          ...base,
          stock: form.stock === '' ? 0 : Number(form.stock),
          localId: Number(form.localId),
        });
      }
      setForm(null);
      setAlert({ type: 'success', message: 'Insumo guardado.' });
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo guardar.' });
    } finally {
      setBusy(false);
    }
  };

  const doAdjust = async () => {
    const qty = Number(adjust.quantity);
    if (!qty || qty < 0) {
      return setAlert({ type: 'warning', message: 'Cantidad no válida.' });
    }
    setBusy(true);
    try {
      await adjustSupply(adjust.supply.id, {
        type: adjust.type,
        quantity: qty,
        reason: adjust.reason || undefined,
      });
      setAdjust(null);
      setAlert({ type: 'success', message: 'Existencia actualizada.' });
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo ajustar.' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (s) => {
    if (!confirm(`¿Eliminar el insumo "${s.name}"?`)) return;
    try {
      await deleteSupply(s.id);
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo eliminar.' });
    }
  };

  return (
    <div className="w-full p-4">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Insumos</h1>
        {canManage && (
          <Button variant="add" icon={PlusIcon} onClick={openNew}>
            Nuevo insumo
          </Button>
        )}
      </div>
      <p className="mb-4 text-sm text-gray-500">
        Lo que usas para preparar la comida (harina, carne, aceite…). Es un
        control aparte del <strong>Menú</strong>: no se vende directamente.
      </p>

      {loaded && supplies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400">
          Aún no tienes insumos. Carga los que usas para cocinar y controla sus
          existencias.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                <th className="px-4 py-3 font-semibold">Insumo</th>
                <th className="px-4 py-3 font-semibold">Existencia</th>
                <th className="px-4 py-3 font-semibold">Mínimo</th>
                <th className="px-4 py-3 font-semibold">Costo unit.</th>
                <th className="px-4 py-3 font-semibold">Proveedor</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {supplies.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{s.name}</div>
                    <div className="text-[11px] text-gray-400">
                      {unitLabel(s.unit)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        s.lowStock ? 'text-red-600' : 'text-gray-800'
                      }`}
                    >
                      {s.lowStock && (
                        <ExclamationTriangleIcon className="h-4 w-4" />
                      )}
                      {s.stock} {unitLabel(s.unit).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {s.minStock ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {s.cost ? formatCOP(s.cost) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {s.provider?.name || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() =>
                          setAdjust({
                            supply: s,
                            type: 'ENTRADA',
                            quantity: '',
                            reason: '',
                          })
                        }
                        className="rounded-lg bg-blue-50 p-1.5 text-blue-600 hover:bg-blue-100"
                        title="Ajustar existencia"
                      >
                        <ArrowsUpDownIcon className="h-4 w-4" />
                      </button>
                      {canManage && (
                        <>
                          <button
                            onClick={() => openEdit(s)}
                            className="rounded-lg bg-gray-50 p-1.5 text-gray-600 hover:bg-gray-100"
                            title="Editar"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => remove(s)}
                            className="rounded-lg bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
                            title="Eliminar"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Crear / editar insumo */}
      {form && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setForm(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">
                {form.id ? 'Editar insumo' : 'Nuevo insumo'}
              </h2>
              <button
                onClick={() => setForm(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500">
                  Nombre
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Carne molida"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500">
                    Unidad
                  </label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  >
                    {UNITS.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                {!form.id && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500">
                      Existencia inicial
                    </label>
                    <input
                      type="number"
                      value={form.stock}
                      onChange={(e) =>
                        setForm({ ...form, stock: e.target.value })
                      }
                      placeholder="0"
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500">
                    Alerta de bajo (opcional)
                  </label>
                  <input
                    type="number"
                    value={form.minStock}
                    onChange={(e) =>
                      setForm({ ...form, minStock: e.target.value })
                    }
                    placeholder="—"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">
                    Costo por unidad (opcional)
                  </label>
                  <input
                    type="number"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    placeholder="—"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {providers.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-500">
                    Proveedor (opcional)
                  </label>
                  <select
                    value={form.providerId}
                    onChange={(e) =>
                      setForm({ ...form, providerId: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="">Sin proveedor</option>
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!form.id && locals.length > 1 && (
                <div>
                  <label className="text-xs font-semibold text-gray-500">
                    Sede
                  </label>
                  <select
                    value={form.localId}
                    onChange={(e) =>
                      setForm({ ...form, localId: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  >
                    {locals.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setForm(null)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={saveForm} loading={busy}>
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Ajustar existencia */}
      {adjust && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setAdjust(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-800">
              Ajustar: {adjust.supply.name}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Existencia actual: {adjust.supply.stock}{' '}
              {unitLabel(adjust.supply.unit).toLowerCase()}
            </p>

            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500">
                  Movimiento
                </label>
                <select
                  value={adjust.type}
                  onChange={(e) =>
                    setAdjust({ ...adjust, type: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                >
                  {ADJUST_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">
                  {adjust.type === 'AJUSTE'
                    ? 'Existencia final'
                    : 'Cantidad'}
                </label>
                <input
                  type="number"
                  value={adjust.quantity}
                  onChange={(e) =>
                    setAdjust({ ...adjust, quantity: e.target.value })
                  }
                  placeholder="0"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">
                  Motivo (opcional)
                </label>
                <input
                  value={adjust.reason}
                  onChange={(e) =>
                    setAdjust({ ...adjust, reason: e.target.value })
                  }
                  placeholder="Ej: compra, consumo del día, merma"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setAdjust(null)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={doAdjust} loading={busy}>
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({})}
      />
    </div>
  );
}
