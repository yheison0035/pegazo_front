'use client';

import { useState, useCallback } from 'react';
import {
  getReturns,
  getReturnById,
  getSaleForReturn,
  createReturn,
} from '../routes/returns';

export default function useReturns() {
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

  return {
    getReturns: useCallback((p) => wrap(getReturns, p), [wrap]),
    getReturnById: useCallback((id) => wrap(getReturnById, id), [wrap]),
    getSaleForReturn: useCallback((id) => wrap(getSaleForReturn, id), [wrap]),
    createReturn: useCallback((dto) => wrap(createReturn, dto), [wrap]),
    loading,
    error,
  };
}
