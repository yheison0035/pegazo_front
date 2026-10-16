'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  XMarkIcon,
  PlusIcon,
  UserPlusIcon,
  IdentificationIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import useCustomers from '@/lib/api/hooks/useCustomers';
import { validateField } from '@/lib/api/utils/validators';
import { lookupCustomerByDocument } from '@/lib/api/routes/customers';

const FIELDS = [
  { name: 'name', label: 'Nombre completo', type: 'text', required: true },
  { name: 'email', label: 'Correo electrónico', type: 'email', required: true },
  { name: 'phone', label: 'Celular', type: 'text', required: true },
];

// Tipos de documento del catálogo DIAN (identificación del adquiriente).
const DOC_TYPES = [
  { value: 'CC', label: 'Cédula de ciudadanía (CC)' },
  { value: 'NIT', label: 'NIT' },
  { value: 'CE', label: 'Cédula de extranjería (CE)' },
  { value: 'TI', label: 'Tarjeta de identidad (TI)' },
  { value: 'PP', label: 'Pasaporte (PP)' },
  { value: 'RC', label: 'Registro civil (RC)' },
];

const labelCls =
  'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500';
const inputCls =
  'w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-800 shadow-sm transition placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20';

export default function NewCustomerModal({ localId, onClose, onCreated }) {
  const { createCustomer, loading } = useCustomers();
  const [data, setData] = useState({
    type_document: 'CC',
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        {/* Encabezado */}
        <div className="flex flex-none items-start justify-between gap-3 border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-sm">
              <UserPlusIcon className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Nuevo cliente</h3>
              <p className="text-xs text-gray-500">
                Guárdalo para facturar y fidelizarlo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 flex-none place-items-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5"
        >
          {/* Identificación: tipo + número en una fila */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Tipo de documento</label>
              <div className="relative">
                <IdentificationIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <select
                  name="type_document"
                  value={data.type_document}
                  onChange={handleChange}
                  className={`${inputCls} appearance-none pr-8`}
                >
                  {DOC_TYPES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <div>
              <label className={labelCls}>Documento / NIT</label>
              <div className="relative">
                <IdentificationIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="document"
                  value={data.document}
                  onChange={handleChange}
                  onBlur={handleDocumentBlur}
                  placeholder="Escribe para buscar…"
                  className={inputCls}
                />
              </div>
              {lookingUp && (
                <p className="mt-1 text-xs text-gray-400">Buscando…</p>
              )}
            </div>
          </div>

          {/* Cliente existente encontrado */}
          {existing && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <CheckCircleIcon className="h-5 w-5 flex-none text-emerald-600" />
              <p className="text-xs font-medium text-emerald-800">
                Ya existe un cliente con ese documento — se usarán sus datos.
              </p>
            </div>
          )}

          {/* Nombre completo */}
          <div>
            <label className={labelCls}>Nombre completo</label>
            <div className="relative">
              <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="name"
                value={data.name}
                onChange={handleChange}
                placeholder="Nombre o razón social"
                className={inputCls}
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.name}
              </p>
            )}
          </div>

          {/* Contacto: correo + celular */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Correo electrónico</label>
              <div className="relative">
                <EnvelopeIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={data.email}
                  onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                  className={inputCls}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className={labelCls}>Celular</label>
              <div className="relative">
                <PhoneIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="phone"
                  value={data.phone}
                  onChange={handleChange}
                  placeholder="300 123 4567"
                  inputMode="numeric"
                  className={inputCls}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {errors.phone}
                </p>
              )}
            </div>
          </div>

          <p className="text-[11px] text-gray-400">
            Para factura electrónica, el correo y el documento son
            obligatorios: con ellos la DIAN le envía su factura.
          </p>

          {apiError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
              {apiError}
            </p>
          )}

          <div className="sticky bottom-0 -mx-6 -mb-5 mt-auto flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="add" icon={PlusIcon} loading={loading}>
              {existing ? 'Usar este cliente' : 'Crear cliente'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
