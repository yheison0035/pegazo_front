'use client';

import { useState, useEffect, useCallback } from 'react';
import { redirect, useParams } from 'next/navigation';
import AlertModal from '@/components/dashboard/modals/alertModal';
import UsersForm from '@/components/dashboard/form/usersForm';
import useProviders from '@/lib/api/hooks/useProviders';

export default function EditProvider() {
  const { id } = useParams();
  const [provider, setProvider] = useState(null);
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });
  const { getProviderById, updateProvider, loading } = useProviders();

  const fetchProvider = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await getProviderById(Number(id));
      setProvider(data);
    } catch (err) {
      setAlert({
        type: 'warning',
        message: err.message || 'No tienes permisos',
        url: '/CRM/dashboard/providers',
      });
    }
  }, [getProviderById, id]);

  useEffect(() => {
    fetchProvider();
  }, [fetchProvider]);

  if (!provider)
    return (
      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => redirect('/CRM/dashboard/providers')}
        url={alert.url}
      />
    );

  return (
    <>
      <UsersForm
        mode="edit"
        loading={loading}
        initialData={provider}
        onSubmit={(data) => updateProvider(Number(id), data)}
      />
    </>
  );
}
