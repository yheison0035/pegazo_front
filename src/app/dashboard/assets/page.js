'use client';

import { useCallback, useEffect, useState } from 'react';
import useLiveRefresh from '@/hooks/useLiveRefresh';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
  ArchiveBoxXMarkIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import Button from '@/components/ui/Button';
import MoneyInput from '@/components/ui/MoneyInput';
import TableActionButton from '@/components/ui/TableActionButton';
import AlertModal from '@/components/dashboard/modals/alertModal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import {
  getAssets,
  createAsset,
  updateAsset,
  disposeAsset,
  deleteAsset,
} from '@/lib/api/routes/assets';

function cop(n) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}
function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString('es-CO');
  } catch {
    return '';
  }
}

const STATUS_BADGE = {
  ACTIVE: { label: 'Activo', cls: 'bg-emerald-50 text-emerald-600' },
  DISPOSED: { label: 'Dado de baja', cls: 'bg-gray-100 text-gray-500' },
  SOLD: { label: 'Vendido', cls: 'bg-orange-50 text-orange-600' },
};

const emptyForm = {
  name: '',
  category: '',
  reference: '',
  acquisitionDate: '',
  quantity: '1',
  unitCost: '',
  salvageValue: '',
  usefulLifeMonths: '',
  notes: '',
};

// Categorías sugeridas (libres; el contador puede escribir la suya).
const CATEGORY_SUGGESTIONS = [
  'Equipo de cómputo',
  'Maquinaria y equipo',
  'Muebles y enseres',
  'Vehículos',
  'Edificaciones',
  'Herramientas',
];

export default function AssetsPage() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState({});
  const [editing, setEditing] = useState(null); // {id?, ...form}
  const [disposing, setDisposing] = useState(null); // asset a dar de baja
  const [confirmDel, setConfirmDel] = useState(null);
  const [catOptions, setCatOptions] = useState(CATEGORY_SUGGESTIONS);
  const [addingCat, setAddingCat] = useState(false);
  const [newCat, setNewCat] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAssets();
      const data = res?.data || [];
      setRows(data);
      setSummary(res?.summary || null);
      // Mezcla las categorías ya usadas con las sugeridas (sin duplicar).
      const used = data.map((a) => a.category).filter(Boolean);
      setCatOptions((prev) => [...new Set([...CATEGORY_SUGGESTIONS, ...prev, ...used])]);
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo cargar.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useLiveRefresh(load);

  const resetCatAdder = () => {
    setAddingCat(false);
    setNewCat('');
  };
  const openNew = () => {
    resetCatAdder();
    setEditing({ ...emptyForm });
  };
  const openEdit = (a) => {
    resetCatAdder();
    setEditing({
      id: a.id,
      name: a.name || '',
      category: a.category || '',
      reference: a.reference || '',
      acquisitionDate: a.acquisitionDate
        ? new Date(a.acquisitionDate).toISOString().slice(0, 10)
        : '',
      quantity: String(a.quantity ?? 1),
      unitCost: a.unitCost ?? (a.quantity ? Math.round((a.cost || 0) / a.quantity) : a.cost) ?? '',
      salvageValue: a.salvageValue ?? '',
      usefulLifeMonths: a.usefulLifeMonths ?? '',
      notes: a.notes || '',
    });
  };

  // Agregar una categoría nueva a la lista y dejarla seleccionada.
  const addCategory = () => {
    const c = newCat.trim();
    if (!c) return;
    setCatOptions((prev) => [...new Set([...prev, c])]);
    setEditing((f) => ({ ...f, category: c }));
    resetCatAdder();
  };

  const save = async () => {
    const f = editing;
    if (!f.name.trim() || !f.acquisitionDate || !f.unitCost || Number(f.unitCost) <= 0) {
      setAlert({
        type: 'error',
        message: 'Completa nombre, fecha de compra y valor unitario.',
      });
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: f.name.trim(),
        category: f.category.trim() || null,
        reference: f.reference.trim() || null,
        acquisitionDate: f.acquisitionDate,
        quantity: Number(f.quantity) || 1,
        unitCost: Number(f.unitCost),
        salvageValue: Number(f.salvageValue) || 0,
        usefulLifeMonths: f.usefulLifeMonths ? Number(f.usefulLifeMonths) : null,
        notes: f.notes.trim() || null,
      };
      if (f.id) await updateAsset(f.id, payload);
      else await createAsset(payload);
      setEditing(null);
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo guardar.' });
    } finally {
      setBusy(false);
    }
  };

  const doDispose = async () => {
    setBusy(true);
    try {
      await disposeAsset(disposing.id, {
        disposalDate: disposing._date || undefined,
        disposalValue: disposing._value ? Number(disposing._value) : undefined,
      });
      setDisposing(null);
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo registrar.' });
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await deleteAsset(confirmDel.id);
      setConfirmDel(null);
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo eliminar.' });
    } finally {
      setBusy(false);
    }
  };

  const cards = [
    { label: 'Valor en libros', value: cop(summary?.totalBookValue), dot: 'bg-emerald-400' },
    { label: 'Costo total', value: cop(summary?.totalCost), dot: 'bg-orange-400' },
    { label: 'Depreciación acumulada', value: cop(summary?.totalAccumulated), dot: 'bg-gray-400' },
    { label: 'Depreciación del mes', value: cop(summary?.monthlyDepreciation), dot: 'bg-amber-400' },
  ];

  return (
    <RoleGuard allowedRoles={[Roles.SUPER_ADMIN, Roles.ADMIN]}>
      <div className="relative mx-auto w-full max-w-5xl p-4">
        <LoadingOverlay show={loading} text="Cargando activos..." />

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-800">
              <BuildingLibraryIcon className="h-6 w-6 text-orange-500" /> Activos
            </h1>
            <p className="text-sm text-gray-500">
              Los bienes de tu negocio (equipos, muebles, vehículos…). Pegazo
              calcula su depreciación y su valor en libros automáticamente.
            </p>
          </div>
          <Button variant="primary" icon={PlusIcon} onClick={openNew}>
            Nuevo activo
          </Button>
        </div>

        {/* Tarjetas de resumen */}
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {cards.map((c) => (
            <div
              key={c.label}
              className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm"
            >
              <div className="flex items-center gap-1.5">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${c.dot}`} />
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                  {c.label}
                </p>
              </div>
              <p className="mt-1.5 text-lg font-bold tabular-nums text-gray-900">
                {c.value}
              </p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Activo</th>
                <th className="px-4 py-3">Compra</th>
                <th className="px-4 py-3 text-right">Costo</th>
                <th className="px-4 py-3 text-right">Dep. acumulada</th>
                <th className="px-4 py-3 text-right">Valor en libros</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((a) => {
                const b = STATUS_BADGE[a.status] || STATUS_BADGE.ACTIVE;
                return (
                  <tr key={a.id} className="text-gray-700">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{a.name}</p>
                      <p className="text-[11px] text-gray-400">
                        {[a.category, a.reference].filter(Boolean).join(' · ') ||
                          'Sin categoría'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {fmtDate(a.acquisitionDate)}
                      <span className="block text-[11px] text-gray-400">
                        {a.usefulLifeMonths
                          ? `${a.usefulLifeMonths} meses vida útil`
                          : 'No se deprecia'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {cop(a.cost)}
                      {a.quantity > 1 && (
                        <span className="block text-[11px] text-gray-400">
                          {a.quantity} × {cop(a.unitCost)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-500">
                      {cop(a.accumulatedDepreciation)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-gray-900">
                      {cop(a.bookValue)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${b.cls}`}
                      >
                        {b.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <TableActionButton
                          icon={PencilSquareIcon}
                          label="Editar"
                          variant="edit"
                          disabled={busy}
                          onClick={() => openEdit(a)}
                        />
                        {a.status === 'ACTIVE' && (
                          <TableActionButton
                            icon={ArchiveBoxXMarkIcon}
                            label="Dar de baja / vender"
                            variant="edit"
                            disabled={busy}
                            onClick={() =>
                              setDisposing({ ...a, _date: '', _value: '' })
                            }
                          />
                        )}
                        <TableActionButton
                          icon={TrashIcon}
                          label="Eliminar"
                          variant="delete"
                          disabled={busy}
                          onClick={() => setConfirmDel(a)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!rows.length && !loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <span>Aún no has registrado activos.</span>
                      <button
                        type="button"
                        onClick={openNew}
                        className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                      >
                        Registrar el primero
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal crear/editar */}
        {editing && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setEditing(null)}
          >
            <div
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">
                  {editing.id ? 'Editar activo' : 'Nuevo activo'}
                </h2>
                <button
                  onClick={() => setEditing(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Nombre del activo *
                  </label>
                  <input
                    autoFocus
                    value={editing.name}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        name: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="Ej: Computador mostrador, Vitrina, Moto de domicilios"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Categoría
                  </label>
                  {addingCat ? (
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        value={newCat}
                        onChange={(e) => setNewCat(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCategory();
                          }
                        }}
                        placeholder="Nueva categoría"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      />
                      <button
                        type="button"
                        onClick={addCategory}
                        className="flex-none rounded-xl bg-orange-500 px-3 text-sm font-semibold text-white hover:bg-orange-600"
                      >
                        Agregar
                      </button>
                      <button
                        type="button"
                        onClick={resetCatAdder}
                        className="flex-none rounded-xl border border-gray-200 px-2 text-gray-500 hover:bg-gray-50"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <select
                      value={editing.category}
                      onChange={(e) => {
                        if (e.target.value === '__new__') {
                          setNewCat('');
                          setAddingCat(true);
                        } else {
                          setEditing({ ...editing, category: e.target.value });
                        }
                      }}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    >
                      <option value="">Sin categoría</option>
                      {catOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="__new__">+ Agregar categoría…</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Referencia / placa / serie
                  </label>
                  <input
                    value={editing.reference}
                    onChange={(e) =>
                      setEditing({ ...editing, reference: e.target.value })
                    }
                    placeholder="Opcional"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Fecha de compra *
                  </label>
                  <input
                    type="date"
                    value={editing.acquisitionDate}
                    onChange={(e) =>
                      setEditing({ ...editing, acquisitionDate: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editing.quantity}
                    onChange={(e) =>
                      setEditing({ ...editing, quantity: e.target.value })
                    }
                    placeholder="1"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Valor unitario *
                  </label>
                  <MoneyInput
                    value={editing.unitCost}
                    onChange={(v) => setEditing({ ...editing, unitCost: v })}
                    placeholder="$ por unidad"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Valor total
                  </label>
                  <div className="flex h-[38px] items-center rounded-xl border border-gray-100 bg-gray-50 px-3 text-sm font-semibold tabular-nums text-gray-800">
                    {cop(
                      (Number(editing.quantity) || 0) *
                        (Number(editing.unitCost) || 0),
                    )}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Vida útil (meses){' '}
                    <span className="font-normal text-gray-400">— opcional</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editing.usefulLifeMonths}
                    onChange={(e) =>
                      setEditing({ ...editing, usefulLifeMonths: e.target.value })
                    }
                    placeholder="Ej: 60 (vacío = no se deprecia)"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Valor de salvamento
                  </label>
                  <MoneyInput
                    value={editing.salvageValue}
                    onChange={(v) => setEditing({ ...editing, salvageValue: v })}
                    placeholder="$ 0 (valor residual estimado)"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Notas
                  </label>
                  <textarea
                    rows={2}
                    value={editing.notes}
                    onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                    className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <p className="mt-3 rounded-lg bg-orange-50/60 px-3 py-2 text-[11px] text-orange-700">
                Si defines vida útil, Pegazo deprecia por línea recta cada mes:
                (valor total − salvamento) ÷ meses. Sin vida útil, el activo no se
                deprecia (su valor en libros se mantiene).
              </p>

              <div className="mt-5 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setEditing(null)}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  icon={CheckCircleIcon}
                  onClick={save}
                  loading={busy}
                >
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal baja / venta */}
        {disposing && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setDisposing(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-gray-800">
                Dar de baja o vender
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                <b>{disposing.name}</b>. Dejará de depreciarse en la fecha
                indicada. Si lo vendiste, registra el valor recibido.
              </p>
              <label className="mb-1 mt-4 block text-xs font-semibold text-gray-600">
                Fecha
              </label>
              <input
                type="date"
                value={disposing._date}
                onChange={(e) =>
                  setDisposing({ ...disposing, _date: e.target.value })
                }
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
              <label className="mb-1 mt-3 block text-xs font-semibold text-gray-600">
                Valor de venta (si aplica)
              </label>
              <input
                type="number"
                min="0"
                value={disposing._value}
                onChange={(e) =>
                  setDisposing({ ...disposing, _value: e.target.value })
                }
                placeholder="Vacío = baja sin venta"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setDisposing(null)}>
                  Cancelar
                </Button>
                <Button variant="primary" onClick={doDispose} loading={busy}>
                  Registrar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmar eliminación */}
        {confirmDel && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setConfirmDel(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-gray-800">Eliminar activo</h2>
              <p className="mt-2 text-sm text-gray-600">
                ¿Eliminar <b>{confirmDel.name}</b>? Esta acción no se puede
                deshacer. Si el activo ya no está, mejor dale de baja para
                conservar el historial.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setConfirmDel(null)}>
                  Cancelar
                </Button>
                <Button variant="danger" onClick={doDelete} loading={busy}>
                  Eliminar
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
    </RoleGuard>
  );
}
