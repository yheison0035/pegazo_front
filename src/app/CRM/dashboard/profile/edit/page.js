'use client';

import { useEffect, useState } from 'react';
import useUsers from '@/lib/api/hooks/useUsers';
import UsersForm from '@/components/dashboard/form/usersForm';

export default function EditProfile() {
  const [perfil, setPerfil] = useState({});
  const { updateUser, loading } = useUsers();

  useEffect(() => {
    const storedUser = localStorage.getItem('usuario');
    if (storedUser) {
      setPerfil(JSON.parse(storedUser));
    }
  }, []);

  const updateDataLocalStorage = async (data) => {
    const updatedUser = { ...perfil, ...data };
    setPerfil(updatedUser);
    localStorage.setItem('usuario', JSON.stringify(updatedUser));
  };

  return (
    <UsersForm
      mode="edit"
      loading={loading}
      initialData={perfil}
      onSubmit={(data) => updateUser(Number(perfil.id), data)}
      updateLocalStorage={(data) => updateDataLocalStorage(data)}
      profile={true}
    />
  );
}
