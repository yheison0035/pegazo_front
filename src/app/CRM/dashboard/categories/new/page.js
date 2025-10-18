'use client';

import { useState } from 'react';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { useAuth } from '@/context/authContext';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import useCategories from '@/lib/api/hooks/useCategories';
import {
  getEmptyCategory,
  getFormFieldsCategories,
} from '@/lib/api/utils/categories.config';

export default function NewCategory() {
  const { usuario } = useAuth();
  const { createCategory, loading } = useCategories();

  const [formData, setFormData] = useState(getEmptyCategory());
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });

  const handleReset = () => setFormData(getEmptyCategory());

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createCategory(formData);
      setAlert({
        type: 'success',
        message: 'Categoria creada correctamente.',
        url: '/CRM/dashboard/categories',
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al crear categoria',
      });
    }
  };

  return (
    <div className="max-w-full mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">
        Crear Categoria Nueva
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Ingrese la información de la categoria para registrar una nueva
        categoria.
      </p>

      <DinamicForm
        formData={formData}
        formFields={getFormFieldsCategories()}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        handleReset={handleReset}
        loading={loading}
        mode="new"
        usuario={usuario}
        module="categories"
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
