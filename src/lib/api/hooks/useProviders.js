'use client';

import { useState, useCallback } from 'react';
import {
  getProviders,
  getProviderById,
  createProvider,
  updateProvider,
  deleteProvider,
} from '../routes/providers/index';

export default function useProviders() {
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

  const getProvidersFn = useCallback(() => wrap(getProviders), [wrap]);
  const getProviderByIdFn = useCallback(
    (id) => wrap(getProviderById, id),
    [wrap]
  );
  const createProviderFn = useCallback(
    (dto) => wrap(createProvider, dto),
    [wrap]
  );
  const updateProviderFn = useCallback(
    (id, dto) => wrap(updateProvider, id, dto),
    [wrap]
  );
  const deleteProviderFn = useCallback(
    (id) => wrap(deleteProvider, id),
    [wrap]
  );

  return {
    getProviders: getProvidersFn,
    getProviderById: getProviderByIdFn,
    createProvider: createProviderFn,
    updateProvider: updateProviderFn,
    deleteProvider: deleteProviderFn,
    loading,
    error,
  };
}
