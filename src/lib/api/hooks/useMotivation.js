'use client';

import { useCallback, useState } from 'react';
import {
  getMotivationMessage,
  createMotivation,
  updateMotivation,
  deleteMotivation,
} from '../routes/motivation/index';

export default function useMotivation() {
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

  const getMotivationMessageFn = useCallback(
    () => wrap(getMotivationMessage),
    [wrap]
  );
  const createMotivationFn = useCallback(
    (dto) => wrap(createMotivation, dto),
    [wrap]
  );
  const updateMotivationFn = useCallback(
    (id, dto) => wrap(updateMotivation, id, dto),
    [wrap]
  );
  const deleteMotivationFn = useCallback(
    (id) => wrap(deleteMotivation, id),
    [wrap]
  );

  return {
    getMotivationMessage: getMotivationMessageFn,
    createMotivation: createMotivationFn,
    updateMotivation: updateMotivationFn,
    deleteMotivation: deleteMotivationFn,
    loading,
    error,
  };
}
