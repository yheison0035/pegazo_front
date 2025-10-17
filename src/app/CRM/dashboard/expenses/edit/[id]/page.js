'use client';

import { useState, useEffect, useCallback } from 'react';
import { redirect, useParams } from 'next/navigation';
import AlertModal from '@/components/dashboard/modals/alertModal';
import UsersForm from '@/components/dashboard/form/usersForm';
import useLocals from '@/lib/api/hooks/useLocals';

export default function EditLocal() {
  const { id } = useParams();
  const [locals, setLocals] = useState(null);
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });
  const { getLocalById, updateLocal, loading } = useLocals();

  const fetchLocal = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await getLocalById(Number(id));
      setLocals(data);
    } catch (err) {
      setAlert({
        type: 'warning',
        message: err.message || 'No tienes permisos',
        url: '/CRM/dashboard/locals',
      });
    }
  }, [getLocalById, id]);

  useEffect(() => {
    fetchLocal();
  }, [fetchLocal]);

  if (!locals)
    return (
      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => redirect('/CRM/dashboard/locals')}
        url={alert.url}
      />
    );

  return (
    <>
      <UsersForm
        mode="edit"
        loading={loading}
        initialData={locals}
        onSubmit={(data) => updateLocal(Number(id), data)}
      />
    </>
  );
}
