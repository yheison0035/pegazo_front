'use client';

import { useCallback, useState } from 'react';
import { searchProducts, createSale } from '../routes/sales/index';

export default function useSales() {
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

  const searchProductsFn = useCallback(
    (term) => wrap(searchProducts, term),
    [wrap]
  );
  const createSaleFn = useCallback((dto) => wrap(createSale, dto), [wrap]);

  return {
    searchProducts: searchProductsFn,
    createSale: createSaleFn,
    loading,
    error,
  };
}
