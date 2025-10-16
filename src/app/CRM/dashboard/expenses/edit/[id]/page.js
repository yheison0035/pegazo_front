'use client';

import { useState, useEffect, useCallback } from 'react';
import { redirect, useParams } from 'next/navigation';
import AlertModal from '@/components/dashboard/modals/alertModal';
import UsersForm from '@/components/dashboard/form/usersForm';
import useExpenses from '@/lib/api/hooks/useExpenses';

export default function EditExpense() {
  const { id } = useParams();
  const [expense, setExpense] = useState(null);
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });
  const { getExpenseById, updateExpense, loading } = useExpenses();

  const fetchExpense = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await getExpenseById(Number(id));
      setExpense(data);
    } catch (err) {
      setAlert({
        type: 'warning',
        message: err.message || 'No tienes permisos',
        url: '/CRM/dashboard/expenses',
      });
    }
  }, [getExpenseById, id]);

  useEffect(() => {
    fetchExpense();
  }, [fetchExpense]);

  if (!expense)
    return (
      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => redirect('/CRM/dashboard/expenses')}
        url={alert.url}
      />
    );

  return (
    <>
      <UsersForm
        mode="edit"
        loading={loading}
        initialData={expense}
        onSubmit={(data) => updateExpense(Number(id), data)}
      />
    </>
  );
}
