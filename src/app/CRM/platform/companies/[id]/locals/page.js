'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  PowerIcon,
  TrashIcon,
  PencilIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

import RoleGuard from '@/auth/roleGuard';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import AlertModal from '@/components/dashboard/modals/alertModal';
import useLocals from '@/lib/api/hooks/useLocals';
import useCompanies from '@/lib/api/hooks/useCompanies';

const EMPTY = {
  name: '',
  city: '',
  address: '',
  department: '',
  phone: '',
};

export default function PlatformCompanyLocals() {
  const params = useParams();
  const companyId = Number(params.id);

  const {
    getLocals,
    createLocal,
    updateLocal,
    deleteLocal,
    setLocalStatus,
    loading,
  } = useLocals();
  const { getCompanyById } = useCompanies();

  const [company, setCompany] = useState(null);
  const [locals, setLocals] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [alert, setAlert] = useState({});

  const fetchData = useCallback(async () => {
    try {
      const [comp, res] = await Promise.all([
        getCompanyById(companyId),
        getLocals({ companyId, limit: 100 }),
      ]);
      setCompany(comp?.data || null);
      setLocals(res?.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Error al cargar' });
    }
  }, [getCompanyById, getLocals, companyId]);

  useEffect(() => {
    if (companyId) fetchData();
  }, [fetchData, companyId]);

  const resetForm = () => {
    setForm(EMPTY);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setAlert({ type: 'error', message: 'El nombre es obligatorio' });
      return;
    }

    try {
      if (editingId) {
        await updateLocal(editingId, { ...form });
        setAlert({ type: 'success', message: 'Local actualizado' });
      } else {
        await createLocal({ ...form, companyId });
        setAlert({ type: 'success', message: 'Local creado' });
      }
      resetForm();
      fetchData();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'No se pudo guardar' });
    }
  };

  const startEdit = (local) => {
    setEditingId(local.id);
    setForm({
      name: local.name || '',
      city: local.city || '',
      address: local.address || '',
      department: local.department || '',
      phone: local.phone || '',
    });
  };

  const handleToggle = async (local) => {
    const next = local.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      await setLocalStatus(local.id, next);
      fetchData();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'No se pudo cambiar' });
    }
  };

  const handleDelete = async (local) => {
    if (!window.confirm(`¿Eliminar el local "${local.name}"?`)) return;
    try {
      await deleteLocal(local.id);
      setAlert({ type: 'success', message: 'Local eliminado' });
      fetchData();
    } catch (err) {
      setAlert({
        type: 'error',
        message:
          err.message ||
          'No se pudo eliminar (puede tener ventas o inventario asociados)',
      });
    }
  };

  return (
    <RoleGuard allowedRoles={['SUPER_PLATFORM_ADMIN']}>
      <div className="w-full p-4">
        <Link
          href="/CRM/platform/companies"
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Volver a empresas
        </Link>

        <h1 className="mb-1 text-2xl font-semibold">
          Locales de {company?.name || '...'}
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          Crea y controla los locales de esta empresa directamente desde la
          plataforma.
        </p>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Formulario crear / editar */}
          <div className="lg:col-span-1">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <h2 className="mb-4 text-sm font-semibold text-gray-800">
                {editingId ? 'Editar local' : 'Nuevo local'}
              </h2>

              {[
                { name: 'name', label: 'Nombre *' },
                { name: 'city', label: 'Ciudad' },
                { name: 'address', label: 'Dirección' },
                { name: 'department', label: 'Departamento' },
                { name: 'phone', label: 'Teléfono' },
              ].map((f) => (
                <div key={f.name} className="mb-3">
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    {f.label}
                  </label>
                  <input
                    type="text"
                    value={form[f.name]}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [f.name]: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  />
                </div>
              ))}

              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  <PlusIcon className="h-4 w-4" />
                  {editingId ? 'Guardar cambios' : 'Crear local'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Listado */}
          <div className="relative lg:col-span-2">
            <LoadingOverlay show={loading} text="Cargando locales..." />
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Ciudad</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {locals.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-gray-400"
                      >
                        Esta empresa aún no tiene locales.
                      </td>
                    </tr>
                  )}
                  {locals.map((local) => (
                    <tr key={local.id} className="text-gray-700">
                      <td className="px-4 py-3 font-medium">{local.name}</td>
                      <td className="px-4 py-3">{local.city || '---'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            local.status === 'ACTIVO'
                              ? 'bg-green-50 text-green-600'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {local.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleToggle(local)}
                            title={
                              local.status === 'ACTIVO'
                                ? 'Desactivar'
                                : 'Activar'
                            }
                            className={`rounded-lg p-2 transition ${
                              local.status === 'ACTIVO'
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                          >
                            <PowerIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => startEdit(local)}
                            title="Editar"
                            className="rounded-lg p-2 text-amber-600 transition hover:bg-amber-50"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(local)}
                            title="Eliminar"
                            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <AlertModal
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({})}
        />
      </div>
    </RoleGuard>
  );
}
