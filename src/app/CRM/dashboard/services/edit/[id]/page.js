'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import AlertModal from '@/components/dashboard/modals/alertModal';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import {
  getFormFieldsServices,
  getEmptyService,
} from '@/lib/api/utils/services.config';
import { useAuth } from '@/context/authContext';
import useServices from '@/lib/api/hooks/useServices';
import { formatCOP, parseCOPToNumber } from '@/lib/api/utils/utils';

export default function EditService() {
  const [formData, setFormData] = useState(getEmptyService());
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });

  const { id } = useParams();
  const auth = useAuth();
  const usuario = auth?.usuario;
  const { getServiceById, updateService, loading } = useServices();

  const fetchService = useCallback(async () => {
    if (!id) return;

    try {
      const { data } = await getServiceById(Number(id));

      setFormData({
        ...data,

        locals:
          data.serviceLocals?.map((l) => ({
            localId: l.localId,
            price: formatCOP(l.price),
          })) || [],
      });
    } catch (err) {
      setAlert({
        type: 'warning',
        message: err.message || 'No tienes permisos',
        url: '/CRM/dashboard/services',
      });
    }
  }, [getServiceById, id]);

  useEffect(() => {
    fetchService();
  }, [fetchService]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      return setAlert({
        type: 'warning',
        message: 'El nombre es obligatorio.',
      });
    }

    if (!formData.locals || formData.locals.length === 0) {
      return setAlert({
        type: 'warning',
        message: 'Debes asignar al menos un local.',
      });
    }

    try {
      await updateService(id, {
        ...formData,
        duration: Number(formData.duration),

        locals: formData.locals.map((l) => ({
          localId: l.localId,
          price: parseCOPToNumber(l.price),
        })),
      });

      setAlert({
        type: 'success',
        message: 'Servicio actualizado correctamente.',
        url: '/CRM/dashboard/services',
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al actualizar servicio',
      });
    }
  };

  return (
    <div className="max-w-full mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Editar Servicio</h2>

      <p className="text-sm text-gray-500 mb-6">
        Modifica la información del servicio.
      </p>

      <DinamicForm
        formData={formData}
        formFields={getFormFieldsServices(usuario)}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        loading={loading}
        mode="edit"
        usuario={usuario}
        module="services"
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
