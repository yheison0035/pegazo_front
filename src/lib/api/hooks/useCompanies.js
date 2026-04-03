'use client';

import { useState, useCallback } from 'react';
import {
  getCompanies,
  createCompany,
  getCompanyById,
  updateCompany,
  deleteCompany,
} from '../routes/companies/index';

export default function useCompanies() {
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

  const getCompaniesFn = useCallback(
    (page, limit) => wrap(getCompanies, page, limit),
    [wrap]
  );
  const getCompanyByIdFn = useCallback(
    (id) => wrap(getCompanyById, id),
    [wrap]
  );
  const createCompanyFn = useCallback(
    (dto) => wrap(createCompany, dto),
    [wrap]
  );
  const updateCompanyFn = useCallback(
    (id, dto) => wrap(updateCompany, id, dto),
    [wrap]
  );
  const deleteCompanyFn = useCallback((id) => wrap(deleteCompany, id), [wrap]);

  return {
    getCompanies: getCompaniesFn,
    getCompanyById: getCompanyByIdFn,
    createCompany: createCompanyFn,
    updateCompany: updateCompanyFn,
    deleteCompany: deleteCompanyFn,
    loading,
    error,
  };
}
