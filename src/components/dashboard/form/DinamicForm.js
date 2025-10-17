'use client';

import { useCallback, useEffect, useState } from 'react';
import DepartaCiudad from '@/components/dashboard/select/depart_ciud';
import BtnReturn from '../buttons/return';
import BtnSave from '../buttons/save';
import useUsers from '@/lib/api/hooks/useUsers';

export default function DinamicForm({
  formData,
  formFields,
  handleSubmit,
  setFormData,
  handleReset,
  isLocked = false,
  loading,
  mode = 'edit',
}) {
  const [dynamicOptions, setDynamicOptions] = useState({});
  const { getUsers } = useUsers();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'department' ? { city: '' } : {}),
    }));
  };

  const fetchDynamicOptions = useCallback(async () => {
    const results = {};

    for (const field of formFields) {
      if (field.type === 'select' && field.source) {
        if (field.source === 'users') {
          const response = await getUsers();
          const data = Array.isArray(response)
            ? response
            : response?.data || [];
          results[field.name] = data.map((u) => ({
            id: u.id,
            name:
              u.name ||
              u.fullName ||
              `${u.firstName ?? ''} ${u.lastName ?? ''}`,
          }));
        }
      }
    }

    setDynamicOptions(results);
  }, [getUsers, formFields]);

  useEffect(() => {
    fetchDynamicOptions();
  }, [fetchDynamicOptions]);

  const hasDepartaCiudad = formFields.some(
    (f) => f.name === 'department' || f.name === 'city'
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {formFields.map((field) => {
          const {
            name,
            label,
            type = 'text',
            required = true,
            options,
          } = field;

          if (name === 'department' || name === 'city') return null;

          if (type === 'select') {
            const fieldOptions = options || dynamicOptions[name] || [];
            return (
              <div key={name} className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  {label}
                </label>
                <select
                  name={name}
                  value={formData[name] || ''}
                  onChange={handleChange}
                  disabled={isLocked}
                  required={required}
                  className={`w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none transition ${
                    isLocked
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                  }`}
                >
                  <option value="">Seleccione una opción</option>
                  {fieldOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
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
                disabled={isLocked}
                required={required}
                className={`w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none transition ${
                  isLocked
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                }`}
              />
            </div>
          );
        })}

        {hasDepartaCiudad && (
          <DepartaCiudad
            formData={formData}
            handleChange={handleChange}
            isLocked={isLocked}
          />
        )}
      </div>

      <div className="flex justify-end mt-6 gap-3">
        <BtnReturn route="/CRM/dashboard/locals" />
        {mode === 'new' && handleReset && (
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm shadow-sm hover:bg-gray-50 transition cursor-pointer"
          >
            Limpiar
          </button>
        )}
        <BtnSave disabled={loading} />
      </div>
    </form>
  );
}
