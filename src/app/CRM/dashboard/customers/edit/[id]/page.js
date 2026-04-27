'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import AlertModal from '@/components/dashboard/modals/alertModal';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import { useAuth } from '@/context/authContext';
import useCustomers from '@/lib/api/hooks/useCustomers';
import { getFormFieldsCustomers } from '@/lib/api/utils/customers.config';

export default function EditCustomer() {
  const [formData, setFormData] = useState({});
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });
  const { id } = useParams();
  const auth = useAuth();
  const usuario = auth?.usuario;
  const { getCustomerById, updateCustomer, loading } = useCustomers();

  const fetchCustomer = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await getCustomerById(Number(id));
      setFormData(data);
    } catch (err) {
      setAlert({
        type: 'warning',
        message: err.message || 'No tienes permisos',
        url: '/CRM/dashboard/customers',
      });
    }
  }, [getCustomerById, id]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateCustomer(id, formData);
      setAlert({
        type: 'success',
        message: 'Cliente actualizado correctamente.',
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
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Editar Cliente</h2>
      <p className="text-sm text-gray-500 mb-6">
        Modifica la información del cliente según sea necesario.
      </p>

      <DinamicForm
        formData={formData}
        formFields={getFormFieldsCustomers()}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        loading={loading}
        mode="edit"
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
