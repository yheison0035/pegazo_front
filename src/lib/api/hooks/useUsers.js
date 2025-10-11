'use client';

import { useState } from 'react';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserRole,
  uploadUserAvatar,
  deleteUserAvatar,
} from '../users';

export default function useUsers() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const wrap = async (fn, ...args) => {
    setLoading(true);
    setError(null);
    try {
      return await fn(...args);
    } catch (err) {
      setError(err.message || 'Error en operación');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    getUsers: () => wrap(getUsers),
    getUserById: (id) => wrap(getUserById, id),
    createUser: (dto) => wrap(createUser, dto),
    updateUser: (id, dto) => wrap(updateUser, id, dto),
    deleteUser: (id) => wrap(deleteUser, id),
    toggleUserRole: (id) => wrap(toggleUserRole, id),
    uploadUserAvatar: (file) => wrap(uploadUserAvatar, file),
    deleteUserAvatar: () => wrap(deleteUserAvatar),
    loading,
    error,
  };
}
