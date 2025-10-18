'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import AlertModal from '@/components/dashboard/modals/alertModal';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import { useAuth } from '@/context/authContext';
import useBrands from '@/lib/api/hooks/useBrands';
import { getFormFieldsBrands } from '@/lib/api/utils/brands.config';

export default function EditBrand() {
  const [formData, setFormData] = useState({});
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });
  const { id } = useParams();
  const { usuario } = useAuth();
  const { getBrandById, updateBrand, loading } = useBrands();

  const fetchBrand = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await getBrandById(Number(id));
      setFormData(data);
    } catch (err) {
      setAlert({
        type: 'warning',
        message: err.message || 'No tienes permisos',
        url: '/CRM/dashboard/brands',
      });
    }
  }, [getBrandById, id]);

  useEffect(() => {
    fetchBrand();
  }, [fetchBrand]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateBrand(formData);
      setAlert({
        type: 'success',
        message: 'Marca actualizada correctamente.',
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
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Editar Marca</h2>
      <p className="text-sm text-gray-500 mb-6">
        Modifica la información de la marca según sea necesario.
      </p>

      <DinamicForm
        formData={formData}
        formFields={getFormFieldsBrands()}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        loading={loading}
        mode="edit"
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
