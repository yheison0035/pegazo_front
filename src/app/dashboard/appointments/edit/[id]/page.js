'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import AlertModal from '@/components/dashboard/modals/alertModal';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import { useAuth } from '@/context/authContext';
import useTerms from '@/hooks/useTerms';
import useAppointments from '@/lib/api/hooks/useAppointments';
import { getFormFieldsAppointments } from '@/lib/api/utils/appointments.config';

export default function EditAppointment() {
  const [formData, setFormData] = useState({});
  const [alert, setAlert] = useState({
    type: '',
    message: '',
    url: '',
  });

  const { id } = useParams();
  const appointmentId = Number(id);

  const auth = useAuth();
  const t = useTerms();
  const usuario = auth?.usuario;

  const { getAppointmentById, updateAppointment, loading } = useAppointments();

  const fetchAppointment = useCallback(async () => {
    if (!appointmentId) return;

    try {
      const { data } = await getAppointmentById(appointmentId);

      setFormData({
        id: data.id,

        date: data.date ? new Date(data.date).toISOString().split('T')[0] : '',

        startTime: data.startTime || '',

        localId: data.localId || '',

        serviceId: data.serviceId || '',

        barberId: data.barberId || '',

        customerId: data.customerId || '',

        notes: data.notes || '',

        status: data.status || 'PENDIENTE',
      });
    } catch (err) {
      setAlert({
        type: 'warning',
        message: err.message || 'No tienes permisos para esta cita',
        url: '/dashboard/appointments',
      });
    }
  }, [appointmentId, getAppointmentById]);

  useEffect(() => {
    fetchAppointment();
  }, [fetchAppointment]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateAppointment(appointmentId, {
        date: formData.date,
        startTime: formData.startTime,

        serviceId: Number(formData.serviceId),

        barberId: Number(formData.barberId),

        customerId: Number(formData.customerId),

        localId: Number(formData.localId),

        notes: formData.notes || '',

        status: formData.status,
      });

      setAlert({
        type: 'success',
        message: 'Cita actualizada correctamente.',
        url: '/dashboard/appointments',
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al actualizar cita',
      });
    }
  };

  return (
    <div className="max-w-full mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Editar Cita</h2>

      <p className="text-sm text-gray-500 mb-6">
        Modifica la información de la cita según sea necesario.
      </p>

      <DinamicForm
        formData={formData}
        formFields={getFormFieldsAppointments(t)}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        loading={loading}
        mode="edit"
        usuario={usuario}
        module="appointments"
      />

      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() =>
          setAlert({
            type: '',
            message: '',
            url: '',
          })
        }
        url={alert.url}
      />
    </div>
  );
}
