'use client';

import { useCallback, useEffect, useState } from 'react';

import RoleGuard from '@/auth/roleGuard';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import Button from '@/components/ui/Button';
import { getGlobalUsers } from '@/lib/api/routes/users';

export default function PlatformUsers() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

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

  return (
    <RoleGuard allowedRoles={['SUPER_PLATFORM_ADMIN']}>
      <div className="w-full p-4">
        <h1 className="mb-1 text-2xl font-semibold">Usuarios Globales</h1>
        <p className="mb-4 text-sm text-gray-500">
          Todos los usuarios de todas las empresas de la plataforma.
        </p>

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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      Sin usuarios.
                    </td>
                  </tr>
                )}
                {users.map((u) => (
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
                          u.status === 'ACTIVO'
                            ? 'bg-green-50 text-green-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
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
    </RoleGuard>
  );
}
