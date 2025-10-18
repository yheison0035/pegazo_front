'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import AlertModal from '@/components/dashboard/modals/alertModal';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import { useAuth } from '@/context/authContext';
import useProviders from '@/lib/api/hooks/useProviders';
import { getFormFieldsProviders } from '@/lib/api/utils/providers.config';

export default function EditProvider() {
  const [formData, setFormData] = useState({});
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });
  const { id } = useParams();
  const { usuario } = useAuth();
  const { getProviderById, updateProvider, loading } = useProviders();

  const fetchProvider = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await getProviderById(Number(id));
      setFormData(data);
    } catch (err) {
      setAlert({
        type: 'warning',
        message: err.message || 'No tienes permisos',
        url: '/CRM/dashboard/providers',
      });
    }
  }, [getProviderById, id]);

  useEffect(() => {
    fetchProvider();
  }, [fetchProvider]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      //await updateProvider(formData);
      setAlert({
        type: 'success',
        message: 'Proveedor actualizado correctamente.',
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
        Editar Proveedor
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Modifica la información del proveedor según sea necesario.
      </p>

      <DinamicForm
        formData={formData}
        formFields={getFormFieldsProviders()}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        loading={loading}
        mode="edit"
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
