'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import AlertModal from '@/components/dashboard/modals/alertModal';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import { useAuth } from '@/context/authContext';
import useExpenses from '@/lib/api/hooks/useExpenses';
import { getFormFieldsExpenses } from '@/lib/api/utils/expenses.config';

export default function EditExpense() {
  const [formData, setFormData] = useState({});
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });
  const { id } = useParams();
  const auth = useAuth();
  const usuario = auth?.usuario;
  const { getExpensesById, updateExpenses, loading } = useExpenses();

  const fetchExpense = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await getExpensesById(Number(id));
      setFormData(data);
    } catch (err) {
      setAlert({
        type: 'warning',
        message: err.message || 'No tienes permisos',
        url: '/dashboard/expenses',
      });
    }
  }, [getExpensesById, id]);

  useEffect(() => {
    fetchExpense();
  }, [fetchExpense]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateExpenses(id, formData);
      setAlert({
        type: 'success',
        message: 'Gasto actualizado correctamente.',
        url: '/dashboard/expenses',
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al crear gasto',
      });
    }
  };

  return (
    <div className="max-w-full mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Editar Gasto</h2>
      <p className="text-sm text-gray-500 mb-6">
        Modifica la información del gasto según sea necesario.
      </p>

      <DinamicForm
        formData={formData}
        formFields={getFormFieldsExpenses()}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        loading={loading}
        mode="edit"
        usuario={usuario}
        module="expenses"
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
