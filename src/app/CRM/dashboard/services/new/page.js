'use client';

import { useState } from 'react';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { useAuth } from '@/context/authContext';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import {
  getEmptyService,
  getFormFieldsServices,
} from '@/lib/api/utils/services.config';
import useServices from '@/lib/api/hooks/useServices';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { parseCOPToNumber } from '@/lib/api/utils/utils';

export default function NewService() {
  const auth = useAuth();
  const usuario = auth?.usuario;
  const { createService, loading } = useServices();

  const [formData, setFormData] = useState(getEmptyService());
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });

  const handleReset = () => {
    setFormData(getEmptyService());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      return setAlert({
        type: 'warning',
        message: 'El nombre del servicio es obligatorio.',
      });
    }

    if (!formData.locals || formData.locals.length === 0) {
      return setAlert({
        type: 'warning',
        message: 'Debes agregar al menos un local con precio.',
      });
    }

    const invalid = formData.locals.find(
      (l) => !l.localId || !l.price || Number(l.price) <= 0
    );

    if (invalid) {
      return setAlert({
        type: 'warning',
        message: 'Todos los locales deben tener precio válido.',
      });
    }

    if (!formData.duration || Number(formData.duration) <= 0) {
      return setAlert({
        type: 'warning',
        message: 'La duración debe ser válida.',
      });
    }

    try {
      await createService({
        ...formData,
        duration: Number(formData.duration),

        locals: formData.locals.map((l) => ({
          localId: l.localId,
          price: parseCOPToNumber(l.price),
        })),
      });

      setAlert({
        type: 'success',
        message: 'Servicio creado correctamente.',
        url: '/CRM/dashboard/services',
      });

      handleReset();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al crear servicio',
      });
    }
  };

  return (
    <>
      <LoadingOverlay
        show={loading}
        text="Creando servicio, por favor espera..."
      />

      <div className="max-w-full mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              Crear Servicio Nuevo
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Registra un nuevo servicio para tu negocio.
            </p>
          </div>
        </div>

        <DinamicForm
          formData={formData}
          formFields={getFormFieldsServices(usuario)}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
          handleReset={handleReset}
          loading={loading}
          mode="new"
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
    </>
  );
}
