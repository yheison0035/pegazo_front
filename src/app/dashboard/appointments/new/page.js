'use client';

import { useState } from 'react';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { useAuth } from '@/context/authContext';
import useTerms from '@/hooks/useTerms';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import useAppointments from '@/lib/api/hooks/useAppointments';
import {
  getEmptyAppointment,
  getFormFieldsAppointments,
} from '@/lib/api/utils/appointments.config';

export default function NewAppointment() {
  const auth = useAuth();
  const t = useTerms();
  const usuario = auth?.usuario;
  const { createAppointment, loading } = useAppointments();

  const [formData, setFormData] = useState(getEmptyAppointment());
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });

  const handleReset = () => setFormData(getEmptyAppointment());

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createAppointment(formData);
      setAlert({
        type: 'success',
        message: 'Cita creada correctamente.',
        url: '/dashboard/appointments',
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al crear cita',
      });
    }
  };

  return (
    <div className="max-w-full mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">
        Programar Nueva Cita
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Ingrese la información de la cita para registrar una nueva cita.
      </p>

      <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
        <span className="font-semibold">Importante:</span> completa los campos{' '}
        <span className="font-semibold">en orden, uno por uno</span>. Cada campo
        habilita las opciones del siguiente — por ejemplo, al elegir el{' '}
        <span className="font-semibold">Local</span> se cargan los servicios,
        barberos y horarios disponibles.
      </div>

      <DinamicForm
        formData={formData}
        formFields={getFormFieldsAppointments(t)}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        handleReset={handleReset}
        loading={loading}
        mode="new"
        usuario={usuario}
        module="appointments"
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
