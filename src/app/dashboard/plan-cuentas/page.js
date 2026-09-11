'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useLiveRefresh from '@/hooks/useLiveRefresh';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import Button from '@/components/ui/Button';
import TableActionButton from '@/components/ui/TableActionButton';
import AlertModal from '@/components/dashboard/modals/alertModal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import {
  getLedgerAccounts,
  createLedgerAccount,
  updateLedgerAccount,
  deleteLedgerAccount,
} from '@/lib/api/routes/ledgerAccounts';

// Orden y etiqueta de los grupos (como se leen los estados financieros).
const TYPES = [
  ['ASSET', 'Activo'],
  ['LIABILITY', 'Pasivo'],
  ['EQUITY', 'Patrimonio'],
  ['INCOME', 'Ingresos'],
  ['COST', 'Costos'],
  ['EXPENSE', 'Gastos'],
];
const TYPE_LABEL = Object.fromEntries(TYPES);
const NATURE_LABEL = { DEBIT: 'Débito', CREDIT: 'Crédito' };

const emptyForm = { code: '', name: '', type: 'ASSET', nature: 'DEBIT' };

export default function PlanCuentasPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState({});
  const [editing, setEditing] = useState(null); // {id?, ...form}
  const [confirmDel, setConfirmDel] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLedgerAccounts();
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

  useLiveRefresh(load);

  const grouped = useMemo(() => {
    const g = {};
    for (const [t] of TYPES) g[t] = [];
    for (const a of rows) (g[a.type] || (g[a.type] = [])).push(a);
    return g;
  }, [rows]);

  const openNew = () => setEditing({ ...emptyForm });
  const openEdit = (a) =>
    setEditing({
      id: a.id,
      code: a.code,
      name: a.name,
      type: a.type,
      nature: a.nature,
      isBase: a.isBase,
      active: a.active,
    });

  const save = async () => {
    const f = editing;
    if (!f.code.trim() || !f.name.trim()) {
      setAlert({ type: 'error', message: 'Completa código y nombre.' });
      return;
    }
    setBusy(true);
    try {
      const payload = {
        code: f.code.trim(),
        name: f.name.trim().toUpperCase(),
        type: f.type,
        nature: f.nature,
      };
      if (f.id) await updateLedgerAccount(f.id, payload);
      else await createLedgerAccount(payload);
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
      await deleteLedgerAccount(confirmDel.id);
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
      <div className="relative mx-auto w-full max-w-4xl p-4">
        <LoadingOverlay show={loading} text="Cargando plan de cuentas..." />

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-800">
              <ListBulletIcon className="h-6 w-6 text-orange-500" /> Plan de
              cuentas
            </h1>
            <p className="text-sm text-gray-500">
              Las cuentas contables de tu negocio (PUC). Ya vienen las básicas;
              puedes agregar o ajustar las que necesites. Serán la base de tus
              libros y estados financieros.
            </p>
          </div>
          <Button variant="primary" icon={PlusIcon} onClick={openNew}>
            Nueva cuenta
          </Button>
        </div>

        <div className="space-y-5">
          {TYPES.map(([type, label]) => {
            const list = grouped[type] || [];
            if (!list.length) return null;
            return (
              <div
                key={type}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/60 px-4 py-2.5">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600">
                    {label}
                  </h2>
                  <span className="text-[11px] text-gray-400">
                    {list.length} cuenta{list.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <table className="min-w-full text-sm">
                  <tbody className="divide-y divide-gray-50">
                    {list.map((a) => (
                      <tr key={a.id} className="text-gray-700">
                        <td className="w-20 px-4 py-2.5 font-mono text-xs text-gray-500">
                          {a.code}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-gray-800">
                          {a.name}
                          {!a.active && (
                            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                              Inactiva
                            </span>
                          )}
                          {!a.isBase && (
                            <span className="ml-2 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
                              Propia
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right text-[11px] text-gray-400">
                          {NATURE_LABEL[a.nature]}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-end gap-1.5">
                            <TableActionButton
                              icon={PencilSquareIcon}
                              label="Editar"
                              variant="edit"
                              disabled={busy}
                              onClick={() => openEdit(a)}
                            />
                            {!a.isBase && (
                              <TableActionButton
                                icon={TrashIcon}
                                label="Eliminar"
                                variant="delete"
                                disabled={busy}
                                onClick={() => setConfirmDel(a)}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        {/* Modal crear/editar */}
        {editing && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setEditing(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">
                  {editing.id ? 'Editar cuenta' : 'Nueva cuenta'}
                </h2>
                <button
                  onClick={() => setEditing(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Código *
                  </label>
                  <input
                    autoFocus
                    value={editing.code}
                    onChange={(e) =>
                      setEditing({ ...editing, code: e.target.value })
                    }
                    placeholder="Ej: 4135"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Naturaleza *
                  </label>
                  <select
                    value={editing.nature}
                    onChange={(e) =>
                      setEditing({ ...editing, nature: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  >
                    <option value="DEBIT">Débito</option>
                    <option value="CREDIT">Crédito</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Nombre *
                  </label>
                  <input
                    value={editing.name}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        name: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="Ej: INGRESOS POR VENTAS"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm uppercase focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Grupo *
                  </label>
                  <select
                    value={editing.type}
                    onChange={(e) =>
                      setEditing({ ...editing, type: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  >
                    {TYPES.map(([t, l]) => (
                      <option key={t} value={t}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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
              <h2 className="text-lg font-bold text-gray-800">Eliminar cuenta</h2>
              <p className="mt-2 text-sm text-gray-600">
                ¿Eliminar <b>{confirmDel.code} · {confirmDel.name}</b>? Esta
                acción no se puede deshacer.
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
