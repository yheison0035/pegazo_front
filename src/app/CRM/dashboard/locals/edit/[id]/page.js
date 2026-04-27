'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import AlertModal from '@/components/dashboard/modals/alertModal';
import useLocals from '@/lib/api/hooks/useLocals';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import { getFormFieldsLocals } from '@/lib/api/utils/locals.config';
import { useAuth } from '@/context/authContext';

export default function EditLocal() {
  const [formData, setFormData] = useState({});
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });
  const { id } = useParams();
  const auth = useAuth();
  const usuario = auth?.usuario;
  const { getLocalById, updateLocal, loading } = useLocals();

  const fetchLocal = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await getLocalById(Number(id));
      setFormData(data);
    } catch (err) {
      setAlert({
        type: 'warning',
        message: err.message || 'No tienes permisos',
        url: '/CRM/dashboard/locals',
      });
    }
  }, [getLocalById, id]);

  useEffect(() => {
    fetchLocal();
  }, [fetchLocal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateLocal(id, formData);
      setAlert({
        type: 'success',
        message: 'Local actualizado correctamente.',
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
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Editar Local</h2>
      <p className="text-sm text-gray-500 mb-6">
        Modifica la información del local según sea necesario.
      </p>

      <DinamicForm
        formData={formData}
        formFields={getFormFieldsLocals()}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        loading={loading}
        mode="edit"
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
