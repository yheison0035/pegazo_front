'use client';

import { useState, useCallback } from 'react';
import {
  getCurrentCash,
  getCashHistory,
  openCash,
  addCashMovement,
  closeCash,
  reopenCash,
  updateCashOpening,
  deleteCash,
} from '../routes/cash';

export default function useCash() {
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
    getCurrentCash: useCallback((localId) => wrap(getCurrentCash, localId), [wrap]),
    getCashHistory: useCallback((params) => wrap(getCashHistory, params), [wrap]),
    openCash: useCallback((dto) => wrap(openCash, dto), [wrap]),
    addCashMovement: useCallback((id, dto) => wrap(addCashMovement, id, dto), [wrap]),
    closeCash: useCallback((id, dto) => wrap(closeCash, id, dto), [wrap]),
    reopenCash: useCallback((id) => wrap(reopenCash, id), [wrap]),
    updateCashOpening: useCallback(
      (id, amount) => wrap(updateCashOpening, id, amount),
      [wrap]
    ),
    deleteCash: useCallback((id) => wrap(deleteCash, id), [wrap]),
    loading,
    error,
  };
}
