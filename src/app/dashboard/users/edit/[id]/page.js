'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import AlertModal from '@/components/dashboard/modals/alertModal';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import { useAuth } from '@/context/authContext';
import useUsers from '@/lib/api/hooks/useUsers';
import { getFormFieldsUsers } from '@/lib/api/utils/users.config';

export default function EditUser() {
  const [formData, setFormData] = useState({});
  const { id } = useParams();
  const auth = useAuth();
  const usuario = auth?.usuario;
  const setUsuario = auth?.setUsuario;
  const {
    getUserById,
    updateUser,
    getMyProfile,
    updateMyProfile,
    loading,
  } = useUsers();
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });

  // ¿El usuario está editando su propio perfil? En ese caso cualquier rol puede
  // hacerlo (autoservicio), pero NO puede cambiar su rol ni su correo.
  const isSelf = !!usuario?.id && Number(id) === Number(usuario.id);

  // Formulario: al editar el propio perfil, rol y correo quedan bloqueados y se
  // ocultan los campos administrativos (local y estado), que no son datos
  // personales y no puede cambiar por sí mismo.
  const formFields = useMemo(() => {
    const fields = getFormFieldsUsers();
    if (!isSelf) return fields;
    return fields
      .filter((f) => f.name !== 'localId' && f.name !== 'status')
      .map((f) =>
        f.name === 'role' || f.name === 'email' ? { ...f, disabled: true } : f
      );
  }, [isSelf]);

  const fetchUser = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = isSelf
        ? await getMyProfile()
        : await getUserById(Number(id));
      setFormData(data);
    } catch (err) {
      setAlert({
        type: 'warning',
        message: err.message || 'No tienes permisos',
        url: isSelf ? '/dashboard' : '/dashboard/users',
      });
    }
  }, [getUserById, getMyProfile, id, isSelf]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Campos internos que no se editan y que el validador del backend rechaza
    // si se reenvían (OTP de recuperación, marcas de tiempo, relaciones).
    const {
      resetOtpHash,
      resetOtpExpires,
      resetOtpAttempts,
      createdAt,
      updatedAt,
      company,
      local,
      managedLocals,
      ...payload
    } = formData;
    try {
      if (isSelf) {
        const { data } = await updateMyProfile(payload);
        // Reflejar los cambios en la sesión (nombre/avatar del sidebar, etc.)
        if (data && setUsuario) {
          const merged = { ...usuario, ...data };
          setUsuario(merged);
          localStorage.setItem('usuario', JSON.stringify(merged));
        }
        setAlert({
          type: 'success',
          message: 'Perfil actualizado correctamente.',
          url: '/dashboard',
        });
      } else {
        await updateUser(id, payload);
        setAlert({
          type: 'success',
          message: 'Usuario actualizado correctamente.',
          url: '/dashboard/users',
        });
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al actualizar',
      });
    }
  };

  return (
    <div className="max-w-full mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">
        {isSelf ? 'Editar mi perfil' : 'Editar Usuario'}
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        {isSelf
          ? 'Actualiza tus datos personales y tu contraseña. El rol y el correo no se pueden modificar.'
          : 'Modifica la información del usuario según sea necesario.'}
      </p>

      <DinamicForm
        formData={formData}
        formFields={formFields}
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
