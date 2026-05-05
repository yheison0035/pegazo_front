'use client';

import { useState, useCallback } from 'react';
import {
  getDeliveredSales,
  getDeliveredSaleById,
  updateDeliveredSale,
  deleteDeliveredSale,
  getVerifyCodeSale,
  getDailySalesReport,
  getSalesRangeReport,
  getSalesRangeGeneralReport,
  getServicePerformanceReport,
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

  const getVerifyCodeSaleFn = useCallback(
    (code) => wrap(getVerifyCodeSale, code),
    [wrap]
  );

  const getDailySalesReportFn = useCallback(
    (date, localId) => wrap(getDailySalesReport, date, localId),
    [wrap]
  );

  const getSalesRangeReportFn = useCallback(
    (dto) => wrap(getSalesRangeReport, dto),
    [wrap]
  );

  const getSalesRangeGeneralReportFn = useCallback(
    (dto) => wrap(getSalesRangeGeneralReport, dto),
    [wrap]
  );

  const getServicePerformanceReportFn = useCallback(
    (dto) => wrap(getServicePerformanceReport, dto),
    [wrap]
  );

  const getDeliveredSalesFn = useCallback(
    (page, limit) => wrap(getDeliveredSales, page, limit),
    [wrap]
  );

  const getDeliveredSaleByIdFn = useCallback(
    (id) => wrap(getDeliveredSaleById, id),
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

  return {
    getVerifyCodeSale: getVerifyCodeSaleFn,
    getDeliveredSales: getDeliveredSalesFn,
    getDeliveredSaleById: getDeliveredSaleByIdFn,
    updateDeliveredSale: updateDeliveredSaleFn,
    deleteDeliveredSale: deleteDeliveredSaleFn,
    getDailySalesReport: getDailySalesReportFn,
    getSalesRangeReport: getSalesRangeReportFn,
    getSalesRangeGeneralReport: getSalesRangeGeneralReportFn,
    getServicePerformanceReport: getServicePerformanceReportFn,
    loading,
    error,
  };
}
