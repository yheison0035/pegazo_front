'use client';

import { useState } from 'react';
import { createSale } from '../sales/index';

export default function useSales() {
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
    createSale: (data) => wrap(createSale, data),
    loading,
    error,
  };
}
