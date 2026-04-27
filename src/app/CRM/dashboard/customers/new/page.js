'use client';

import { useState } from 'react';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { useAuth } from '@/context/authContext';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import {
  getEmptyCustomer,
  getFormFieldsCustomers,
} from '@/lib/api/utils/customers.config';
import useCustomers from '@/lib/api/hooks/useCustomers';

export default function NewCustomer() {
  const auth = useAuth();
  const usuario = auth?.usuario;
  const { createCustomer, loading } = useCustomers();

  const [formData, setFormData] = useState(getEmptyCustomer());
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });

  const handleReset = () => setFormData(getEmptyCustomer());

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createCustomer(formData);
      setAlert({
        type: 'success',
        message: 'Cliente creado correctamente.',
        url: '/CRM/dashboard/customers',
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al crear cliente',
      });
    }
  };

  return (
    <div className="max-w-full mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">
        Crear Cliente Nuevo
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Ingrese la información del cliente para registrar un nuevo cliente.
      </p>

      <DinamicForm
        formData={formData}
        formFields={getFormFieldsCustomers()}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        handleReset={handleReset}
        loading={loading}
        mode="new"
        usuario={usuario}
        module="customers"
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
