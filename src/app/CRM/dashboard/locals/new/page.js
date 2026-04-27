'use client';

import { useState } from 'react';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { useAuth } from '@/context/authContext';
import useLocals from '@/lib/api/hooks/useLocals';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import {
  getEmptyLocal,
  getFormFieldsLocals,
} from '@/lib/api/utils/locals.config';

export default function NewLocal() {
  const auth = useAuth();
  const usuario = auth?.usuario;
  const { createLocal, loading } = useLocals();

  const [formData, setFormData] = useState(getEmptyLocal());
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });

  const handleReset = () => setFormData(getEmptyLocal());

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createLocal(formData);
      setAlert({
        type: 'success',
        message: 'Local creado correctamente.',
        url: '/CRM/dashboard/locals',
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al crear local',
      });
    }
  };

  return (
    <div className="max-w-full mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">
        Crear Local Nuevo
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Ingrese la información del local para registrar un nuevo local.
      </p>

      <DinamicForm
        formData={formData}
        formFields={getFormFieldsLocals()}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        handleReset={handleReset}
        loading={loading}
        mode="new"
        usuario={usuario}
        module="locals"
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
