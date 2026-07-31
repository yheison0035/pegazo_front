'use client';

import { useState, useCallback } from 'react';
import {
  getLocals,
  getLocalById,
  createLocal,
  updateLocal,
  deleteLocal,
  setLocalStatus,
  getPublicLocals,
} from '../routes/locals/index';

export default function useLocals() {
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

  const getLocalsFn = useCallback((params) => wrap(getLocals, params), [wrap]);
  const getLocalByIdFn = useCallback((id) => wrap(getLocalById, id), [wrap]);
  const createLocalFn = useCallback((dto) => wrap(createLocal, dto), [wrap]);
  const updateLocalFn = useCallback(
    (id, dto) => wrap(updateLocal, id, dto),
    [wrap]
  );
  const deleteLocalFn = useCallback((id) => wrap(deleteLocal, id), [wrap]);
  const setLocalStatusFn = useCallback(
    (id, status) => wrap(setLocalStatus, id, status),
    [wrap]
  );
  const getPublicLocalsFn = useCallback(
    (params) => wrap(getPublicLocals, params),
    [wrap]
  );

  return {
    getLocals: getLocalsFn,
    getLocalById: getLocalByIdFn,
    createLocal: createLocalFn,
    updateLocal: updateLocalFn,
    deleteLocal: deleteLocalFn,
    setLocalStatus: setLocalStatusFn,
    getPublicLocals: getPublicLocalsFn,
    loading,
    error,
  };
}
