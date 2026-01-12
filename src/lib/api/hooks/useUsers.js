'use client';

import { useState, useCallback } from 'react';
import {
  getRoles,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserRole,
  uploadUserAvatar,
  deleteUserAvatar,
} from '../routes/users';

export default function useUsers() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const wrap = useCallback(async (fn, ...args) => {
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
  }, []);

  const getRolesFn = useCallback(() => wrap(getRoles), [wrap]);
  const getUsersFn = useCallback(() => wrap(getUsers), [wrap]);
  const getUserByIdFn = useCallback((id) => wrap(getUserById, id), [wrap]);
  const createUserFn = useCallback((dto) => wrap(createUser, dto), [wrap]);
  const updateUserFn = useCallback(
    (id, dto) => wrap(updateUser, id, dto),
    [wrap]
  );
  const deleteUserFn = useCallback((id) => wrap(deleteUser, id), [wrap]);
  const toggleUserRoleFn = useCallback(
    (id) => wrap(toggleUserRole, id),
    [wrap]
  );
  const uploadUserAvatarFn = useCallback(
    (file) => wrap(uploadUserAvatar, file),
    [wrap]
  );
  const deleteUserAvatarFn = useCallback(() => wrap(deleteUserAvatar), [wrap]);

  return {
    getRoles: getRolesFn,
    getUsers: getUsersFn,
    getUserById: getUserByIdFn,
    createUser: createUserFn,
    updateUser: updateUserFn,
    deleteUser: deleteUserFn,
    toggleUserRole: toggleUserRoleFn,
    uploadUserAvatar: uploadUserAvatarFn,
    deleteUserAvatar: deleteUserAvatarFn,
    loading,
    error,
  };
}
