'use client';

import { useState, useCallback } from 'react';
import {
  getPurchases,
  getPurchaseById,
  createPurchase,
  receivePurchase,
  cancelPurchase,
} from '../routes/purchases';

export default function usePurchases() {
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
    getPurchases: useCallback((p) => wrap(getPurchases, p), [wrap]),
    getPurchaseById: useCallback((id) => wrap(getPurchaseById, id), [wrap]),
    createPurchase: useCallback((dto) => wrap(createPurchase, dto), [wrap]),
    receivePurchase: useCallback((id) => wrap(receivePurchase, id), [wrap]),
    cancelPurchase: useCallback((id) => wrap(cancelPurchase, id), [wrap]),
    loading,
    error,
  };
}
