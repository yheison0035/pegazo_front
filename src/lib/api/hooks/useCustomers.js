'use client';

import { useState } from 'react';
import {
  getCustomers,
  getDeliveredCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  addComment,
  assignAdvisor,
  assignMultipleCustomers,
  importCustomers,
  exportDeliveredCustomers,
} from '../customers/index';

export default function useCustomers() {
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
    getCustomers: () => wrap(getCustomers),
    getDeliveredCustomers: () => wrap(getDeliveredCustomers),
    getCustomerById: (id) => wrap(getCustomerById, id),
    createCustomer: (dto) => wrap(createCustomer, dto),
    updateCustomer: (id, dto) => wrap(updateCustomer, id, dto),
    deleteCustomer: (id) => wrap(deleteCustomer, id),
    addComment: (id, desc) => wrap(addComment, id, desc),
    assignAdvisor: (cid, aid) => wrap(assignAdvisor, cid, aid),
    assignMultipleCustomers: (customerIds, selectedAdvisor) =>
      wrap(assignMultipleCustomers, { customerIds, selectedAdvisor }),
    importCustomers: (file) => wrap(importCustomers, file),
    exportDeliveredCustomers: () => wrap(exportDeliveredCustomers),
    loading,
    error,
  };
}
