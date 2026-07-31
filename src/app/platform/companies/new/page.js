'use client';

import { useState } from 'react';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { useAuth } from '@/context/authContext';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import {
  getEmptyCompany,
  getFormFieldsCompanies,
} from '@/lib/api/utils/companies.config';
import useCompanies from '@/lib/api/hooks/useCompanies';

export default function NewCompany() {
  const auth = useAuth();
  const usuario = auth?.usuario;
  const { createCompany, loading } = useCompanies();

  const [formData, setFormData] = useState(getEmptyCompany());
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });

  const handleReset = () => setFormData(getEmptyCompany());

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createCompany(formData);
      setAlert({
        type: 'success',
        message: formData.adminEmail
          ? `Empresa creada. El administrador ya puede iniciar sesión con: ${formData.adminEmail}`
          : 'Empresa creada correctamente.',
        url: '/platform/companies',
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al crear empresa',
      });
    }
  };

  return (
    <div className="max-w-full mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">
        Crear Empresa Nueva
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Ingrese la información de la empresa para registrar una nueva empresa.
      </p>

      <DinamicForm
        formData={formData}
        formFields={getFormFieldsCompanies(true)}
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
