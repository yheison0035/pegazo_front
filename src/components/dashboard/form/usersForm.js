'use client';

import { useCallback, useEffect, useState } from 'react';
import BtnClean from '@/components/dashboard/buttons/clear';
import BtnSave from '@/components/dashboard/buttons/save';
import BtnReturn from '@/components/dashboard/buttons/return';
import DepartaCiudad from '@/components/dashboard/select/depart_ciud';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { Roles } from '@/config/roles';
import { useAuth } from '@/context/authContext';
import useUsers from '@/lib/api/hooks/useUsers';
import useLocals from '@/lib/api/hooks/useLocals';

export default function UsersForm({
  formFields,
  initialData,
  onSubmit,
  loading,
  mode = 'create',
  profile = false,
  updateLocalStorage,
}) {
  const [formData, setFormData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });
  const [dynamicOptions, setDynamicOptions] = useState({});
  const { usuario } = useAuth();
  const { getUsers } = useUsers();
  const { getLocals } = useLocals();

  useEffect(() => {
    setFormData(initialData || {});
  }, [initialData]);

  const fetchDynamicOptions = useCallback(async () => {
    if (!Array.isArray(formFields)) return;

    const loaders = {
      users: getUsers,
      locals: getLocals,
    };

    const results = {};

    for (const field of formFields) {
      if (field?.type === 'select' && loaders[field.source]) {
        const fetcher = loaders[field.source];
        const response = await fetcher();
        const data = Array.isArray(response) ? response : response?.data || [];

        results[field.name] = data.map((item) => ({
          id: item.id,
          name:
            item.name ||
            `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim(),
        }));
      }
    }

    setDynamicOptions(results);
  }, [formFields, getUsers, getLocals]);

  useEffect(() => {
    fetchDynamicOptions();
  }, [fetchDynamicOptions]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'department' ? { city: '' } : {}),
    }));
  };

  const handleReset = () => setFormData(initialData);

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (mode === 'edit' && !payload.password) delete payload.password;
      await onSubmit(payload);
      if (profile) await updateLocalStorage(payload);

      setAlert({
        type: 'success',
        message: profile
          ? 'Perfil actualizado correctamente.'
          : mode === 'create'
          ? 'Asesor creado correctamente.'
          : 'Asesor actualizado correctamente.',
        url: !profile ? '/CRM/dashboard/users' : '',
        onClose: () => setAlert({ type: '', message: '', url: '' }),
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al guardar el asesor.',
      });
    }
  };

  const getRoleOptions = (options) => {
    const allRoles = options;
    if (usuario?.role === Roles.SUPER_ADMIN) return allRoles;
    return allRoles.filter((r) => r !== Roles.SUPER_ADMIN);
  };

  return (
    <div className="max-w-full mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">
        {profile
          ? 'Perfil de Usuario'
          : mode === 'create'
          ? 'Crear Asesor Nuevo'
          : 'Editar Asesor'}
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        {profile
          ? 'Actualice su información personal y de contacto.'
          : mode === 'create'
          ? 'Ingrese la información personal y de contacto para registrar un nuevo asesor.'
          : 'Actualice la información personal y de contacto del asesor.'}
      </p>

      <form onSubmit={handleSubmitForm} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(formFields) &&
            formFields.map((field) => {
              const {
                name,
                label,
                type = 'text',
                required = true,
                options,
                source,
              } = field;
              if (name === 'department' || name === 'city') return null;
              if (type === 'select') {
                let fieldOptions = options || dynamicOptions[source] || [];
                if (name === 'role') {
                  fieldOptions = getRoleOptions(options);
                }
                return (
                  <div key={name} className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">
                      {label}
                    </label>
                    <select
                      name={name}
                      value={formData[name] || ''}
                      onChange={handleChange}
                      required={required}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    >
                      <option value="">Seleccione una opción</option>
                      {fieldOptions.length ? (
                        fieldOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          No hay opciones disponibles
                        </option>
                      )}
                    </select>
                  </div>
                );
              }

              return (
                <div key={name} className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    {label}
                  </label>
                  <input
                    type={type}
                    name={name}
                    value={formData[name] || ''}
                    onChange={handleChange}
                    required={required}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  />
                </div>
              );
            })}

          <DepartaCiudad formData={formData} handleChange={handleChange} />

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              {mode === 'create' ? 'Contraseña' : 'Nueva Contraseña'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password || ''}
                onChange={handleChange}
                placeholder={
                  mode === 'create'
                    ? 'Ingrese la contraseña'
                    : 'Dejar en blanco si no desea cambiarla'
                }
                required={mode === 'create'}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-700 hover:text-gray-800 cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6 gap-3">
          <BtnReturn
            route={
              profile ? '/CRM/dashboard/customers' : '/CRM/dashboard/users'
            }
          />
          {mode === 'create' && <BtnClean handleReset={handleReset} />}
          <BtnSave disabled={loading} />
        </div>
      </form>

      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: '', message: '', url: '' })}
        url={alert.url}
      />
    </div>
  );
}
