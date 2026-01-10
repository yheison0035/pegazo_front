'use client';

import { useState } from 'react';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { useAuth } from '@/context/authContext';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import useProviders from '@/lib/api/hooks/useProviders';
import {
  getEmptyProvider,
  getFormFieldsProviders,
} from '@/lib/api/utils/providers.config';

export default function NewProvider() {
  const { usuario } = useAuth();
  const { createProvider, loading } = useProviders();

  const [formData, setFormData] = useState(getEmptyProvider());
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });

  const handleReset = () => setFormData(getEmptyProvider());

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createProvider(formData);
      setAlert({
        type: 'success',
        message: 'Proveedor creado correctamente.',
        url: '/CRM/dashboard/providers',
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al crear proveedor',
      });
    }
  };

  return (
    <div className="max-w-full mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">
        Crear Proveedor Nuevo
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Ingrese la información del proveedor para registrar un nuevo proveedor.
      </p>

      <DinamicForm
        formData={formData}
        formFields={getFormFieldsProviders()}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        handleReset={handleReset}
        loading={loading}
        mode="new"
        usuario={usuario}
        module="providers"
      />

      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: '', message: '', url: '' })}
        url={alert.url}
      />
    </div>
  );
}
