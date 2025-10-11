'use client';

import { useState } from 'react';
import { getStates, getStateById } from '../states/index';

export default function useStates() {
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
    getStates: () => wrap(getStates),
    getStateById: (id) => wrap(getStateById, id),
    loading,
    error,
  };
}
