'use client';

import { useState, useCallback } from 'react';
import {
  getRoles,
  getStatus,
  getPaymentMethods,
  getPaymentStatus,
  getSaleStatus,
} from '../routes/enums';

export default function useEnums() {
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
  const getStatusFn = useCallback(() => wrap(getStatus), [wrap]);
  const getPaymentMethodsFn = useCallback(
    () => wrap(getPaymentMethods),
    [wrap]
  );
  const getPaymentStatusFn = useCallback(() => wrap(getPaymentStatus), [wrap]);
  const getSaleStatusFn = useCallback(() => wrap(getSaleStatus), [wrap]);

  return {
    getRoles: getRolesFn,
    getStatus: getStatusFn,
    getPaymentMethods: getPaymentMethodsFn,
    getPaymentStatus: getPaymentStatusFn,
    getSaleStatus: getSaleStatusFn,
    loading,
    error,
  };
}
