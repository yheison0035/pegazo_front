'use client';

import { useState, useCallback } from 'react';
import {
  getDeliveredSales,
  getDeliveredSaleById,
  updateDeliveredSale,
  deleteDeliveredSale,
  exportDeliveredSales,
} from '../routes/delivered_sales/index';

export default function useDeliveredSales() {
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

  const getDeliveredSalesFn = useCallback(
    () => wrap(getDeliveredSales),
    [wrap]
  );
  const getDeliveredSaleByIdFn = useCallback(
    (id) => wrap(getDeliveredSaleById, id),
    [wrap]
  );
  const createDeliveredSaleFn = useCallback(
    (dto) => wrap(createDeliveredSale, dto),
    [wrap]
  );
  const updateDeliveredSaleFn = useCallback(
    (id, dto) => wrap(updateDeliveredSale, id, dto),
    [wrap]
  );
  const deleteDeliveredSaleFn = useCallback(
    (id) => wrap(deleteDeliveredSale, id),
    [wrap]
  );
  const exportDeliveredSalesFn = useCallback(
    (id) => wrap(exportDeliveredSales, id),
    [wrap]
  );

  return {
    getDeliveredSales: getDeliveredSalesFn,
    getDeliveredSaleById: getDeliveredSaleByIdFn,
    createDeliveredSale: createDeliveredSaleFn,
    updateDeliveredSale: updateDeliveredSaleFn,
    deleteDeliveredSale: deleteDeliveredSaleFn,
    exportDeliveredSales: exportDeliveredSalesFn,
    loading,
    error,
  };
}
