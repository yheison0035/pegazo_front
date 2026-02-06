'use client';

import { useState, useCallback } from 'react';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../routes/categories/index';

export default function useCategories() {
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

  const getCategoriesFn = useCallback(
    (page, limit) => wrap(getCategories, page, limit),
    [wrap]
  );
  const getCategoryByIdFn = useCallback(
    (id) => wrap(getCategoryById, id),
    [wrap]
  );
  const createCategoryFn = useCallback(
    (dto) => wrap(createCategory, dto),
    [wrap]
  );
  const updateCategoryFn = useCallback(
    (id, dto) => wrap(updateCategory, id, dto),
    [wrap]
  );
  const deleteCategoryFn = useCallback(
    (id) => wrap(deleteCategory, id),
    [wrap]
  );

  return {
    getCategories: getCategoriesFn,
    getCategoryById: getCategoryByIdFn,
    createCategory: createCategoryFn,
    updateCategory: updateCategoryFn,
    deleteCategory: deleteCategoryFn,
    loading,
    error,
  };
}
