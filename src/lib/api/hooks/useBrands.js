'use client';

import { useState, useCallback } from 'react';
import {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
} from '../routes/brands/index';

export default function useBrands() {
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

  const getBrandsFn = useCallback(() => wrap(getBrands), [wrap]);
  const getBrandByIdFn = useCallback((id) => wrap(getBrandById, id), [wrap]);
  const createBrandFn = useCallback((dto) => wrap(createBrand, dto), [wrap]);
  const updateBrandFn = useCallback(
    (id, dto) => wrap(updateBrand, id, dto),
    [wrap]
  );
  const deleteBrandFn = useCallback((id) => wrap(deleteBrand, id), [wrap]);

  return {
    getBrands: getBrandsFn,
    getBrandById: getBrandByIdFn,
    createBrand: createBrandFn,
    updateBrand: updateBrandFn,
    deleteBrand: deleteBrandFn,
    loading,
    error,
  };
}
