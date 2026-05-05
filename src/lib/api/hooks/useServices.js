'use client';

import { useState, useCallback } from 'react';
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getPublicServices,
} from '../routes/services/index';

export default function useServices() {
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

  const getServicesFn = useCallback(
    (page, limit) => wrap(getServices, page, limit),
    [wrap]
  );
  const getServiceByIdFn = useCallback(
    (id) => wrap(getServiceById, id),
    [wrap]
  );
  const createServiceFn = useCallback(
    (dto) => wrap(createService, dto),
    [wrap]
  );
  const updateServiceFn = useCallback(
    (id, dto) => wrap(updateService, id, dto),
    [wrap]
  );
  const deleteServiceFn = useCallback((id) => wrap(deleteService, id), [wrap]);

  const getPublicServicesFn = useCallback(
    (params) => wrap(getPublicServices, params),
    [wrap]
  );

  return {
    getServices: getServicesFn,
    getServiceById: getServiceByIdFn,
    createService: createServiceFn,
    updateService: updateServiceFn,
    deleteService: deleteServiceFn,
    getPublicServices: getPublicServicesFn,
    loading,
    error,
  };
}
