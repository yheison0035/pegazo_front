'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import useCustomers from '@/lib/api/hooks/useCustomers';
import { validateField } from '@/lib/api/utils/validators';
import { lookupCustomerByDocument } from '@/lib/api/routes/customers';

const FIELDS = [
  { name: 'name', label: 'Nombre completo', type: 'text', required: true },
  { name: 'email', label: 'Correo electrónico', type: 'email', required: true },
  { name: 'phone', label: 'Celular', type: 'text', required: true },
];

export default function NewCustomerModal({ localId, onClose, onCreated }) {
  const { createCustomer, loading } = useCustomers();
  const [data, setData] = useState({
    document: '',
    name: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [existing, setExisting] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const finalValue = name === 'name' ? value.toUpperCase() : value;
    setData((prev) => ({ ...prev, [name]: finalValue }));
    if (name === 'document') setExisting(null);
    const field = FIELDS.find((f) => f.name === name);
    setErrors((prev) => ({
      ...prev,
      [name]: field ? validateField(field, finalValue) : null,
    }));
  };

  // Al salir del campo documento: si ese cliente ya existe en la empresa, se
  // trae y se autocompleta (evita duplicados y datos repetidos).
  const handleDocumentBlur = async () => {
    const doc = (data.document || '').trim();
    if (!doc) return;
    setLookingUp(true);
    try {
      const res = await lookupCustomerByDocument(doc);
      const found = res?.data;
      if (found) {
        setExisting(found);
        setData((prev) => ({
          ...prev,
          name: found.name || '',
          email: found.email || '',
          phone: found.phone || '',
        }));
        setErrors({});
      }
    } catch {
      // silencioso: si falla el lookup, se sigue creando normal
    } finally {
      setLookingUp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Evita que el submit del modal burbujee (por el portal de React) hasta el
    // formulario de la factura y dispare su validación.
    e.stopPropagation();
    setApiError('');

    // Si el documento ya corresponde a un cliente existente, se usa ese.
    if (existing) {
      onCreated(existing);
      return;
    }

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

  if (typeof document === 'undefined') return null;

  return createPortal(
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
          {/* Documento con autocompletado */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">
              Documento / NIT
            </label>
            <input
              type="text"
              name="document"
              value={data.document}
              onChange={handleChange}
              onBlur={handleDocumentBlur}
              placeholder="Escribe el documento para buscar..."
              className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm shadow-sm transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {lookingUp && (
              <p className="mt-1 text-xs text-gray-400">Buscando...</p>
            )}
            {existing && (
              <p className="mt-1 text-xs font-medium text-emerald-600">
                Cliente existente encontrado — se usarán sus datos.
              </p>
            )}
          </div>

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
    </div>,
    document.body
  );
}
