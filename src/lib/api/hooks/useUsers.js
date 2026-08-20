'use client';

import { useState, useCallback } from 'react';
import {
  getUsers,
  getUserById,
  getMyProfile,
  updateMyProfile,
  createUser,
  updateUser,
  deleteUser,
  toggleUserRole,
  uploadUserAvatar,
  deleteUserAvatar,
  getUsersByRole,
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

  const getUsersFn = useCallback(
    (page, limit) => wrap(getUsers, page, limit),
    [wrap]
  );
  const getUserByIdFn = useCallback((id) => wrap(getUserById, id), [wrap]);
  const getMyProfileFn = useCallback(() => wrap(getMyProfile), [wrap]);
  const updateMyProfileFn = useCallback(
    (dto) => wrap(updateMyProfile, dto),
    [wrap]
  );
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

  const getUsersByRoleFn = useCallback(
    (params) => wrap(getUsersByRole, params),
    [wrap]
  );

  return {
    getUsers: getUsersFn,
    getUserById: getUserByIdFn,
    getMyProfile: getMyProfileFn,
    updateMyProfile: updateMyProfileFn,
    createUser: createUserFn,
    updateUser: updateUserFn,
    deleteUser: deleteUserFn,
    toggleUserRole: toggleUserRoleFn,
    uploadUserAvatar: uploadUserAvatarFn,
    deleteUserAvatar: deleteUserAvatarFn,
    getUsersByRole: getUsersByRoleFn,
    loading,
    error,
  };
}
