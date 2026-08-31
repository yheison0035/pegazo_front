'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import Button from '@/components/ui/Button';
import TableActionButton from '@/components/ui/TableActionButton';
import AlertModal from '@/components/dashboard/modals/alertModal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import {
  getUnitsOfMeasure,
  createUnitOfMeasure,
  updateUnitOfMeasure,
  deleteUnitOfMeasure,
} from '@/lib/api/routes/unitsOfMeasure';

const BEHAVIORS = [
  { code: 'UNIDAD', label: 'Por unidad (cantidades enteras)' },
  { code: 'PESO', label: 'Por peso / medida (admite decimales)' },
];
const BEHAVIOR_LABEL = Object.fromEntries(BEHAVIORS.map((b) => [b.code, b.label]));

export default function UnitsOfMeasurePage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState({});
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUnitsOfMeasure();
      setRows(res?.data || []);
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo cargar.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    const name = (editing?.name || '').trim();
    if (!name || !editing.code) return;
    setBusy(true);
    try {
      if (editing.id)
        await updateUnitOfMeasure(editing.id, { name, code: editing.code });
      else await createUnitOfMeasure({ name, code: editing.code });
      setEditing(null);
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo guardar.' });
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await deleteUnitOfMeasure(confirmDel.id);
      setConfirmDel(null);
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo eliminar.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <RoleGuard allowedRoles={[Roles.SUPER_ADMIN, Roles.ADMIN]}>
      <div className="relative mx-auto w-full max-w-2xl p-4">
        <LoadingOverlay show={loading} text="Cargando..." />

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Unidades de medida
            </h1>
            <p className="text-sm text-gray-500">
              Las unidades con las que vendes tus productos (unidad, kg, litro,
              caja…).
            </p>
          </div>
          <Button
            variant="primary"
            icon={PlusIcon}
            onClick={() => setEditing({ name: '', code: 'UNIDAD' })}
          >
            Nueva unidad
          </Button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Unidad</th>
                <th className="px-4 py-3">Se vende</th>
                <th className="px-4 py-3 text-right">Productos</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((r) => (
                <tr key={r.id} className="text-gray-700">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {r.name}
                    {!r.isBase && (
                      <span className="ml-2 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-600">
                        Personalizado
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {r.code === 'PESO' ? 'Por peso / medida' : 'Por unidad'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {r.usageCount}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <TableActionButton
                        icon={PencilSquareIcon}
                        label="Editar"
                        variant="edit"
                        disabled={busy}
                        onClick={() =>
                          setEditing({ id: r.id, name: r.name, code: r.code })
                        }
                      />
                      <TableActionButton
                        icon={TrashIcon}
                        label="Eliminar"
                        variant="delete"
                        disabled={busy}
                        onClick={() => setConfirmDel(r)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && !loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    Aún no hay unidades.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {editing && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setEditing(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">
                  {editing.id ? 'Editar unidad' : 'Nueva unidad'}
                </h2>
                <button
                  onClick={() => setEditing(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Nombre
              </label>
              <input
                autoFocus
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value.toUpperCase() })
                }
                placeholder="EJ: KILOGRAMO, LITRO, CAJA…"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm uppercase focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
              <label className="mb-1 mt-4 block text-xs font-semibold text-gray-600">
                ¿Cómo se vende?
              </label>
              <select
                value={editing.code}
                onChange={(e) => setEditing({ ...editing, code: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                {BEHAVIORS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-gray-400">
                &quot;Por peso&quot; permite vender cantidades con decimales (1.5
                kg). &quot;Por unidad&quot; solo enteros.
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

        {confirmDel && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setConfirmDel(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-gray-800">Eliminar unidad</h2>
              <p className="mt-2 text-sm text-gray-600">
                ¿Eliminar <b>{confirmDel.name}</b>?
                {confirmDel.usageCount > 0 && (
                  <>
                    {' '}
                    {confirmDel.usageCount} producto(s) la usan; conservan su valor.
                  </>
                )}
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
