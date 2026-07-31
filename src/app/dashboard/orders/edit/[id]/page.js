'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import AlertModal from '@/components/dashboard/modals/alertModal';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import { useAuth } from '@/context/authContext';
import useCategories from '@/lib/api/hooks/useCategories';
import { getFormFieldsCategories } from '@/lib/api/utils/categories.config';

export default function EditCategory() {
  const [formData, setFormData] = useState({});
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });
  const { id } = useParams();
  const auth = useAuth();
  const usuario = auth?.usuario;
  const { getCategoryById, updateCategory, loading } = useCategories();

  const fetchCategory = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await getCategoryById(Number(id));
      setFormData(data);
    } catch (err) {
      setAlert({
        type: 'warning',
        message: err.message || 'No tienes permisos',
        url: '/dashboard/categories',
      });
    }
  }, [getCategoryById, id]);

  useEffect(() => {
    fetchCategory();
  }, [fetchCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateCategory(id, formData);
      setAlert({
        type: 'success',
        message: 'Categoria actualizada correctamente.',
        url: '/dashboard/categories',
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
        Editar Categoria
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Modifica la información de la categoria según sea necesario.
      </p>

      <DinamicForm
        formData={formData}
        formFields={getFormFieldsCategories()}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        loading={loading}
        mode="edit"
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
