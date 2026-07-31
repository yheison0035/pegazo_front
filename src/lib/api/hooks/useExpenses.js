'use client';

import { useCallback, useState } from 'react';
import {
  getExpenses,
  getExpensesById,
  createExpenses,
  updateExpenses,
  deleteExpenses,
} from '../routes/expenses/index';

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

  const getExpensesFn = useCallback(
    (params) => wrap(getExpenses, params),
    [wrap]
  );
  const getExpensesByIdFn = useCallback(
    (id) => wrap(getExpensesById, id),
    [wrap]
  );
  const createExpensesFn = useCallback(
    (dto) => wrap(createExpenses, dto),
    [wrap]
  );
  const updateExpensesFn = useCallback(
    (id, dto) => wrap(updateExpenses, id, dto),
    [wrap]
  );
  const deleteExpensesFn = useCallback(
    (id) => wrap(deleteExpenses, id),
    [wrap]
  );

  return {
    getExpenses: getExpensesFn,
    getExpensesById: getExpensesByIdFn,
    createExpenses: createExpensesFn,
    updateExpenses: updateExpensesFn,
    deleteExpenses: deleteExpensesFn,
    loading,
    error,
  };
}
