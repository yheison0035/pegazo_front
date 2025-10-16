'use client';

import { useState } from 'react';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { useAuth } from '@/context/authContext';
import CustomerForm from '@/components/dashboard/form/customerForm';
import useSales from '@/lib/api/hooks/useSales';

export default function NewSale() {
  const { usuario } = useAuth();
  const { createSale } = useSales();

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
      await createSale(formData);
      setAlert({
        type: 'success',
        message: 'Venta creada correctamente.',
        url: '/CRM/dashboard/delivered-sales',
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al crear venta',
      });
    }
  };

  return (
    <div className="max-w-max mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">
        Registrar Nueva Venta
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Complete los campos para registrar una nueva venta.
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
