'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import useCustomers from '@/lib/api/hooks/useCustomers';
import { validateField } from '@/lib/api/utils/validators';

const FIELDS = [
  { name: 'name', label: 'Nombre completo', type: 'text', required: true },
  { name: 'email', label: 'Correo electrónico', type: 'email', required: true },
  { name: 'phone', label: 'Celular', type: 'text', required: true },
];

export default function NewCustomerModal({ localId, onClose, onCreated }) {
  const { createCustomer, loading } = useCustomers();
  const [data, setData] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    const field = FIELDS.find((f) => f.name === name);
    setErrors((prev) => ({
      ...prev,
      [name]: field ? validateField(field, value) : null,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const nextErrors = {};
    for (const field of FIELDS) {
      const error = validateField(field, data[field.name]);
      if (error) nextErrors[field.name] = error;
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      const res = await createCustomer({ ...data, localId });
      const customer = res?.data || res;
      onCreated(customer);
    } catch (err) {
      setApiError(err.message || 'No se pudo crear el cliente');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-800">Nuevo cliente</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 transition hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {FIELDS.map((field) => (
            <div key={field.name} className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-700">
                {field.label}
              </label>
              <input
                type={field.type}
                name={field.name}
                value={data[field.name]}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm shadow-sm transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              {errors[field.name] && (
                <p className="mt-1 text-sm font-medium text-red-600">
                  {errors[field.name]}
                </p>
              )}
            </div>
          ))}

          {apiError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
              {apiError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
