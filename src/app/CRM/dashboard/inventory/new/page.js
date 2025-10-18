'use client';

import { useState } from 'react';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { useAuth } from '@/context/authContext';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import {
  getEmptyInventory,
  getFormFieldsInventory,
} from '@/lib/api/utils/inventory.config';
import useProducts from '@/lib/api/hooks/useProducts';

export default function NewProduct() {
  const { usuario } = useAuth();
  const { createProduct, loading } = useProducts();

  const [formData, setFormData] = useState(getEmptyInventory());
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });

  const handleReset = () => setFormData(getEmptyInventory());

  const handleSubmit = async (e) => {
    console.log(formData);
    e.preventDefault();
    try {
      //await createProduct(formData);
      setAlert({
        type: 'success',
        message: 'Producto creado correctamente.',
        url: '/CRM/dashboard/inventory',
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al crear producto',
      });
    }
  };

  return (
    <div className="max-w-full mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">
        Crear Producto Nuevo
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Ingrese la información del producto para registrar un nuevo producto.
      </p>

      <DinamicForm
        formData={formData}
        formFields={getFormFieldsInventory()}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        handleReset={handleReset}
        loading={loading}
        mode="new"
        usuario={usuario}
        module="inventory"
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
