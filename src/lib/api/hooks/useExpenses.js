'use client';

import { useCallback, useState } from 'react';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  importExpenses,
} from '../expenses/index';

export default function useExpenses() {
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

  const getExpensesFn = useCallback(() => wrap(getExpenses), [wrap]);
  const getExpenseByIdFn = useCallback(
    (id) => wrap(getExpenseById, id),
    [wrap]
  );
  const createExpenseFn = useCallback(
    (dto) => wrap(createExpense, dto),
    [wrap]
  );
  const updateExpenseFn = useCallback(
    (id, dto) => wrap(updateExpense, id, dto),
    [wrap]
  );
  const deleteExpenseFn = useCallback((id) => wrap(deleteExpense, id), [wrap]);
  const importExpensesFn = useCallback(
    (file) => wrap(importExpenses, file),
    [wrap]
  );

  return {
    getExpenses: getExpensesFn,
    getExpenseById: getExpenseByIdFn,
    createExpense: createExpenseFn,
    updateExpense: updateExpenseFn,
    deleteExpense: deleteExpenseFn,
    importExpenses: importExpensesFn,
    loading,
    error,
  };
}
