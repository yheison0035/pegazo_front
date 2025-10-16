'use client';

import { useState, useCallback } from 'react';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  importProducts,
} from '../products/index';

export default function useProducts() {
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

  const getProductsFn = useCallback(() => wrap(getProducts), [wrap]);
  const getProductByIdFn = useCallback(
    (id) => wrap(getProductById, id),
    [wrap]
  );
  const createProductFn = useCallback(
    (dto) => wrap(createProduct, dto),
    [wrap]
  );
  const updateProductFn = useCallback(
    (id, dto) => wrap(updateProduct, id, dto),
    [wrap]
  );
  const deleteProductFn = useCallback((id) => wrap(deleteProduct, id), [wrap]);
  const importProductsFn = useCallback(
    (file) => wrap(importProducts, file),
    [wrap]
  );

  return {
    getProducts: getProductsFn,
    getProductById: getProductByIdFn,
    createProduct: createProductFn,
    updateProduct: updateProductFn,
    deleteProduct: deleteProductFn,
    importProducts: importProductsFn,
    loading,
    error,
  };
}
