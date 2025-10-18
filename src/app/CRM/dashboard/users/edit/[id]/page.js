'use client';

import { useState, useEffect, useCallback } from 'react';
import { redirect, useParams } from 'next/navigation';
import AlertModal from '@/components/dashboard/modals/alertModal';
import UsersForm from '@/components/dashboard/form/usersForm';
import useUsers from '@/lib/api/hooks/useUsers';
import { getFormFieldsUsers } from '@/lib/api/utils/users.config';

export default function EditUser() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });
  const { getUserById, updateUser, loading } = useUsers();

  const fetchUser = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await getUserById(Number(id));
      setUser(data);
    } catch (err) {
      setAlert({
        type: 'warning',
        message: err.message || 'No tienes permisos',
        url: '/CRM/dashboard/users',
      });
    }
  }, [getUserById, id]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (!user)
    return (
      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => redirect('/CRM/dashboard/users')}
        url={alert.url}
      />
    );

  return (
    <>
      <UsersForm
        formFields={getFormFieldsUsers()}
        mode="edit"
        loading={loading}
        initialData={user}
        onSubmit={(data) => updateUser(Number(id), data)}
      />
    </>
  );
}
