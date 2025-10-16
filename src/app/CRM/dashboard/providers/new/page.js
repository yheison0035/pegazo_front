'use client';

import { useState } from 'react';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { useAuth } from '@/context/authContext';
import CustomerForm from '@/components/dashboard/form/customerForm';
import useProviders from '@/lib/api/hooks/useProviders';

export default function NewProvider() {
  const { usuario } = useAuth();
  const { createProvider } = useProviders();

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
      await createProvider(formData);
      setAlert({
        type: 'success',
        message: 'Proveedor creado correctamente.',
        url: '/CRM/dashboard/providers',
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al crear proveedor',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">
        Crear Proveedor Nuevo
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Ingrese la información personal y de contacto para registrar un nuevo
        proveedor.
      </p>

      <CustomerForm
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
