'use client';

import { useCallback, useEffect, useState } from 'react';
import { KeyIcon, PowerIcon } from '@heroicons/react/24/outline';

import RoleGuard from '@/auth/roleGuard';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import Button from '@/components/ui/Button';
import TableActionButton from '@/components/ui/TableActionButton';
import {
  getGlobalUsers,
  platformSetUserStatus,
  platformResetUserPassword,
} from '@/lib/api/routes/users';

export default function PlatformUsers() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [resetUser, setResetUser] = useState(null); // usuario al que se le resetea la clave
  const [newPass, setNewPass] = useState('');
  const [msg, setMsg] = useState(null); // { type, text }

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getGlobalUsers({ page, limit: 20, name: search });
      setUsers(res?.data || []);
      setMeta(res?.meta || null);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const toggleStatus = async (u) => {
    const next = u.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const verb = next === 'ACTIVO' ? 'activar' : 'desactivar';
    if (!confirm(`¿Seguro que deseas ${verb} a ${u.name}?`)) return;
    setBusyId(u.id);
    try {
      await platformSetUserStatus(u.id, next);
      setUsers((list) =>
        list.map((x) => (x.id === u.id ? { ...x, status: next } : x)),
      );
      flash('success', `Usuario ${next === 'ACTIVO' ? 'activado' : 'desactivado'}.`);
    } catch (e) {
      flash('error', e?.message || 'No se pudo cambiar el estado.');
    } finally {
      setBusyId(null);
    }
  };

  const submitReset = async () => {
    if (!resetUser) return;
    if ((newPass || '').length < 6) {
      flash('error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setBusyId(resetUser.id);
    try {
      await platformResetUserPassword(resetUser.id, newPass);
      flash('success', `Contraseña actualizada para ${resetUser.name}.`);
      setResetUser(null);
      setNewPass('');
    } catch (e) {
      flash('error', e?.message || 'No se pudo resetear la contraseña.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <RoleGuard allowedRoles={['SUPER_PLATFORM_ADMIN']}>
      <div className="w-full p-4">
        <h1 className="mb-1 text-2xl font-semibold">Usuarios Globales</h1>
        <p className="mb-4 text-sm text-gray-500">
          Todos los usuarios de todas las empresas de la plataforma.
        </p>

        {msg && (
          <div
            className={`mb-4 rounded-lg px-4 py-2 text-sm ${
              msg.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {msg.text}
          </div>
        )}

        <input
          type="text"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Buscar por nombre..."
          className="mb-4 w-full max-w-sm rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
        />

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <LoadingOverlay show={loading} text="Cargando usuarios..." />
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Correo</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Empresa</th>
                  <th className="px-4 py-3">Sede</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      Sin usuarios.
                    </td>
                  </tr>
                )}
                {users.map((u) => {
                  const isPlatform = u.role === 'SUPER_PLATFORM_ADMIN';
                  const isActive = u.status === 'ACTIVO';
                  return (
                    <tr key={u.id} className="text-gray-700">
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-600">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">{u.company?.name || '---'}</td>
                      <td className="px-4 py-3">{u.local?.name || '---'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            isActive
                              ? 'bg-green-50 text-green-600'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isPlatform ? (
                          <span className="block text-center text-xs text-gray-300">
                            —
                          </span>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <TableActionButton
                              icon={KeyIcon}
                              label="Resetear contraseña"
                              variant="info"
                              disabled={busyId === u.id}
                              onClick={() => {
                                setNewPass('');
                                setResetUser(u);
                              }}
                            />
                            <TableActionButton
                              icon={PowerIcon}
                              label={isActive ? 'Desactivar' : 'Activar'}
                              variant={isActive ? 'danger' : 'success'}
                              disabled={busyId === u.id}
                              onClick={() => toggleStatus(u)}
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm">
              <span className="text-gray-500">
                Página {meta.page} de {meta.totalPages} · {meta.total} usuarios
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: resetear contraseña */}
      {resetUser && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-800">
              Resetear contraseña
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Nueva contraseña para <b>{resetUser.name}</b> ({resetUser.email}).
            </p>
            <input
              type="text"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="mt-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
              autoFocus
            />
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setResetUser(null);
                  setNewPass('');
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={busyId === resetUser.id}
                onClick={submitReset}
              >
                Guardar contraseña
              </Button>
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
