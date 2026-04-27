'use client';

import { useState } from 'react';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { useAuth } from '@/context/authContext';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import {
  getEmptyBrand,
  getFormFieldsBrands,
} from '@/lib/api/utils/brands.config';
import useBrands from '@/lib/api/hooks/useBrands';

export default function NewBrand() {
  const auth = useAuth();
  const usuario = auth?.usuario;
  const { createBrand, loading } = useBrands();

  const [formData, setFormData] = useState(getEmptyBrand());
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });

  const handleReset = () => setFormData(getEmptyBrand());

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createBrand(formData);
      setAlert({
        type: 'success',
        message: 'Marca creada correctamente.',
        url: '/CRM/dashboard/brands',
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al crear marca',
      });
    }
  };

  return (
    <div className="max-w-full mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">
        Crear Marca Nueva
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Ingrese la información de la marca para registrar una nueva marca.
      </p>

      <DinamicForm
        formData={formData}
        formFields={getFormFieldsBrands()}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        handleReset={handleReset}
        loading={loading}
        mode="new"
        usuario={usuario}
        module="brands"
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
