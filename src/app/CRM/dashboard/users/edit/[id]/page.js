'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import AlertModal from '@/components/dashboard/modals/alertModal';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import { useAuth } from '@/context/authContext';
import useUsers from '@/lib/api/hooks/useUsers';
import { getFormFieldsUsers } from '@/lib/api/utils/users.config';

export default function EditUser() {
  const [formData, setFormData] = useState({});
  const { id } = useParams();
  const { usuario } = useAuth();
  const { getUserById, updateUser, loading } = useUsers();
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });

  const fetchUser = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await getUserById(Number(id));
      setFormData(data);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUser(id, formData);
      setAlert({
        type: 'success',
        message: 'Usuario actualizado correctamente.',
        url: '/CRM/dashboard/users',
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al crear proveedor',
      });
    }
  };

  return (
    <div className="max-w-full mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Editar Usuario</h2>
      <p className="text-sm text-gray-500 mb-6">
        Modifica la información del usuario según sea necesario.
      </p>

      <DinamicForm
        formData={formData}
        formFields={getFormFieldsUsers()}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        loading={loading}
        mode="edit"
        usuario={usuario}
        module="users"
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
