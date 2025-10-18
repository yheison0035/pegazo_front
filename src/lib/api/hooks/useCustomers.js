'use client';

import { useState, useCallback } from 'react';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../routes/customers/index';

export default function useCustomers() {
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

  const getCustomersFn = useCallback(() => wrap(getCustomers), [wrap]);
  const getCustomerByIdFn = useCallback(
    (id) => wrap(getCustomerById, id),
    [wrap]
  );
  const createCustomerFn = useCallback(
    (dto) => wrap(createCustomer, dto),
    [wrap]
  );
  const updateCustomerFn = useCallback(
    (id, dto) => wrap(updateCustomer, id, dto),
    [wrap]
  );
  const deleteCustomerFn = useCallback(
    (id) => wrap(deleteCustomer, id),
    [wrap]
  );

  return {
    getCustomers: getCustomersFn,
    getCustomerById: getCustomerByIdFn,
    createCustomer: createCustomerFn,
    updateCustomer: updateCustomerFn,
    deleteCustomer: deleteCustomerFn,
    loading,
    error,
  };
}
