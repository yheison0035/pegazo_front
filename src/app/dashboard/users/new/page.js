'use client';

import { useState } from 'react';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { useAuth } from '@/context/authContext';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import useUsers from '@/lib/api/hooks/useUsers';
import { getEmptyUser, getFormFieldsUsers } from '@/lib/api/utils/users.config';

export default function NewUser() {
  const auth = useAuth();
  const usuario = auth?.usuario;
  const { createUser, loading } = useUsers();

  const [formData, setFormData] = useState(getEmptyUser());
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });

  const handleReset = () => setFormData(getEmptyUser());

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rate = (v) => {
      if (v === '' || v === null || v === undefined) return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const payload = {
      ...formData,
      commissionServiceRate: rate(formData.commissionServiceRate),
      commissionProductRate: rate(formData.commissionProductRate),
    };
    try {
      await createUser(payload);
      setAlert({
        type: 'success',
        message: 'Usuario creado correctamente.',
        url: '/dashboard/users',
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al crear usuario',
      });
    }
  };

  return (
    <div className="max-w-full mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">
        Crear Usuario Nuevo
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Ingrese la información del usuario para registrar un nuevo usuario.
      </p>

      <DinamicForm
        formData={formData}
        formFields={getFormFieldsUsers()}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        handleReset={handleReset}
        loading={loading}
        mode="create"
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
