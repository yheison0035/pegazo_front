'use client';

import { useState, useCallback } from 'react';
import {
  getOrders,
  getOrderById,
  updateOrderFulfillment,
} from '../routes/orders';

export default function useOrders() {
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

  const getOrdersFn = useCallback((params) => wrap(getOrders, params), [wrap]);
  const getOrderByIdFn = useCallback((id) => wrap(getOrderById, id), [wrap]);
  const updateFulfillmentFn = useCallback(
    (id, dto) => wrap(updateOrderFulfillment, id, dto),
    [wrap]
  );

  return {
    getOrders: getOrdersFn,
    getOrderById: getOrderByIdFn,
    updateOrderFulfillment: updateFulfillmentFn,
    loading,
    error,
  };
}
