'use client';

import { useEffect, useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import useUsers from '@/lib/api/hooks/useUsers';

export default function Avatar({ perfil = {}, setPerfil }) {
  const [alert, setAlert] = useState({ message: '' });
  const [avatarPreview, setAvatarPreview] = useState(perfil?.avatar || null);
  const { uploadUserAvatar, deleteUserAvatar } = useUsers();

  useEffect(() => {
    if (perfil?.avatar) {
      setAvatarPreview(`${perfil.avatar}?t=${Date.now()}`);
    } else {
      setAvatarPreview(null);
    }
  }, [perfil?.avatar]);

  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(() => setAlert({ message: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert.message]);

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

  const colors = [
    'bg-orange-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-amber-500',
    'bg-teal-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-cyan-500',
  ];

  const getColor = (name) => {
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
      hash &= hash;
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const handleRemoveAvatar = async () => {
    try {
      await deleteUserAvatar();

      if (avatarPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }

      const updated = { ...perfil, avatar: null };
      setPerfil(updated);
      setAvatarPreview(null);

      const input = document.getElementById('avatar-input');
      if (input) input.value = '';

      localStorage.setItem('usuario', JSON.stringify(updated));
      setAlert({ message: 'Avatar eliminado correctamente.' });
    } catch (error) {
      console.error('Error eliminando avatar:', error);
      setAlert({ message: 'No se pudo eliminar el avatar.' });
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const tempUrl = URL.createObjectURL(file);
      setAvatarPreview(tempUrl);

      const resp = await uploadUserAvatar(file);
      const updatedUser = resp?.data ?? resp;

      if (updatedUser) {
        setPerfil(updatedUser);
        setAvatarPreview(`${updatedUser.avatar}?t=${Date.now()}`);
        localStorage.setItem('usuario', JSON.stringify(updatedUser));
        setAlert({ message: 'Se actualizó el avatar.' });
      }
    } catch (err) {
      console.error('Error subiendo avatar:', err);
      setAlert({ message: 'Error al subir avatar' });
    } finally {
      e.target.value = '';
    }
  };

  return (
    <>
      <div className="relative w-24 h-24">
        <label className="w-full h-full block rounded-full overflow-hidden group cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
            id="avatar-input"
          />

          {avatarPreview ? (
            <img
              key={avatarPreview}
              src={avatarPreview}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center text-white font-bold ${getColor(
                perfil?.name
              )}`}
            >
              {getInitial(perfil?.name)}
            </div>
          )}

          <div
            className="absolute inset-0 font-semibold bg-black/40 opacity-0 group-hover:opacity-100 
            flex items-center justify-center text-white text-xs transition rounded-full"
          >
            Cambiar
          </div>
        </label>

        {avatarPreview && (
          <button
            type="button"
            onClick={handleRemoveAvatar}
            className="absolute -top-2 -right-2 bg-white p-1 rounded-full text-red-500 hover:text-red-700 shadow cursor-pointer"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {alert.message && (
        <span className="text-green-500 text-xs block mt-1">
          {alert.message}
        </span>
      )}
    </>
  );
}
