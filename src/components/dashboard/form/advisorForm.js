'use client';

import { useEffect, useState } from 'react';
import BtnClean from '@/components/dashboard/buttons/clear';
import BtnSave from '@/components/dashboard/buttons/save';
import BtnReturn from '@/components/dashboard/buttons/return';
import DepartaCiudad from '@/components/dashboard/select/depart_ciud';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { Roles } from '@/config/roles';
import { useAuth } from '@/context/authContext';
import usePermissions from '@/hooks/usePermissions';

export default function AdvisorForm({
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
  const { usuario } = useAuth();
  const { canAssign, canViewAll } = usePermissions();

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'department' ? { city: '' } : {}),
    }));
  };

  const handleReset = () => setFormData(initialData);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (mode === 'edit' && !payload.password) {
        delete payload.password;
      }
      await onSubmit(payload);
      if (profile) {
        await updateLocalStorage(payload);
      }
      setAlert({
        type: 'success',
        message: profile
          ? 'Perfil actualizado correctamente.'
          : mode === 'create'
          ? 'Asesor creado correctamente.'
          : 'Asesor actualizado correctamente.',
        url: !profile ? '/CRM/dashboard/advisors' : '',
        onClose: () => setAlert({ type: '', message: '', url: '' }),
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al guardar el asesor.',
      });
    }
  };

  const getRoleOptions = () => {
    const allRoles = Object.values(Roles);
    if (usuario?.role === Roles.SUPER_ADMIN) {
      return allRoles;
    }
    return allRoles.filter((role) => role !== Roles.SUPER_ADMIN);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
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

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            ['name', 'Nombre', 'text'],
            ['email', 'Correo', 'email'],
            ['birthdate', 'Fecha de Nacimiento', 'date'],
            ['phone', 'Teléfono', 'number'],
            ['address', 'Dirección', 'text'],
            ['document', 'Documento', 'number'],
          ].map(([name, label, type = 'text']) => (
            <div key={name} className="flex flex-col">
              <label
                htmlFor={name}
                className="text-sm font-medium text-gray-700 mb-1"
              >
                {label}
              </label>
              <input
                type={type}
                id={name}
                name={name}
                value={formData[name] || ''}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm 
                  focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                required={name}
              />
            </div>
          ))}

          <DepartaCiudad formData={formData} handleChange={handleChange} />

          {canAssign && (
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <select
                name="role"
                value={formData.role || ''}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm 
                focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                required
              >
                <option value="">Selecciona un rol</option>
                {getRoleOptions().map((rol) => (
                  <option key={rol} value={rol}>
                    {rol}
                  </option>
                ))}
              </select>
            </div>
          )}

          {canViewAll && (
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                name="status"
                value={formData.status || ''}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm 
                focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                required
              >
                <option value="">Selecciona un estado</option>
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
              </select>
            </div>
          )}

          <div className="flex flex-col">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              {mode === 'create' ? 'Contraseña' : 'Nueva Contraseña'}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password || ''}
                onChange={handleChange}
                placeholder={
                  mode === 'create'
                    ? 'Ingrese la contraseña'
                    : 'Dejar en blanco si no desea cambiarla'
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm 
                  focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                required={mode === 'create'}
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
            route={`${
              profile ? '/CRM/dashboard/customers' : '/CRM/dashboard/advisors'
            }`}
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
