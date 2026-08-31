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
  getExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
} from '@/lib/api/routes/expenseCategories';

export default function ExpenseCategoriesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState({});
  const [editing, setEditing] = useState(null); // {id?, name}
  const [confirmDel, setConfirmDel] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getExpenseCategories();
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
    if (!name) return;
    setBusy(true);
    try {
      if (editing.id) await updateExpenseCategory(editing.id, { name });
      else await createExpenseCategory({ name });
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
      await deleteExpenseCategory(confirmDel.id);
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
              Tipos de gasto
            </h1>
            <p className="text-sm text-gray-500">
              Administra las categorías con las que clasificas tus gastos.
            </p>
          </div>
          <Button
            variant="primary"
            icon={PlusIcon}
            onClick={() => setEditing({ name: '' })}
          >
            Nuevo tipo
          </Button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Origen</th>
                <th className="px-4 py-3 text-right">Gastos</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((r) => (
                <tr key={r.id} className="text-gray-700">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {r.name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        r.isBase
                          ? 'bg-gray-100 text-gray-500'
                          : 'bg-orange-50 text-orange-600'
                      }`}
                    >
                      {r.isBase ? 'Base' : 'Personalizado'}
                    </span>
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
                        onClick={() => setEditing({ id: r.id, name: r.name })}
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
                    Aún no hay tipos de gasto.
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
              className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">
                  {editing.id ? 'Editar tipo de gasto' : 'Nuevo tipo de gasto'}
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
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && save()}
                placeholder="Ej: Publicidad, Netflix, Domicilios…"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
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

        {/* Confirmar borrado */}
        {confirmDel && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setConfirmDel(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-gray-800">Eliminar tipo</h2>
              <p className="mt-2 text-sm text-gray-600">
                ¿Eliminar <b>{confirmDel.name}</b>?
                {confirmDel.usageCount > 0 && (
                  <>
                    {' '}
                    Tiene {confirmDel.usageCount} gasto(s) asociados; se conservan
                    en el histórico.
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
