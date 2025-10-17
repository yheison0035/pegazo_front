'use client';

import { useState } from 'react';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { useAuth } from '@/context/authContext';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import useProducts from '@/lib/api/hooks/useProducts';

export default function NewProvider() {
  const { usuario } = useAuth();
  const { createProduct } = useProducts();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    document: '',
    department: '',
    city: '',
    stateId: 0,
    birthdate: '',
    advisorId: 0,
  });
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });

  const handleReset = () =>
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      document: '',
      department: '',
      city: '',
      stateId: 0,
      birthdate: '',
      advisorId: 0,
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createProduct(formData);
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
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        handleReset={handleReset}
        loading={false}
        mode="new"
        usuario={usuario}
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
