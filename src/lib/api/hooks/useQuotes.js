'use client';

import { useState, useCallback } from 'react';
import {
  getQuotes,
  getQuoteById,
  createQuote,
  acceptQuote,
  rejectQuote,
  convertQuote,
  deleteQuote,
} from '../routes/quotes';

export default function useQuotes() {
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

  return {
    getQuotes: useCallback((p) => wrap(getQuotes, p), [wrap]),
    getQuoteById: useCallback((id) => wrap(getQuoteById, id), [wrap]),
    createQuote: useCallback((dto) => wrap(createQuote, dto), [wrap]),
    acceptQuote: useCallback((id) => wrap(acceptQuote, id), [wrap]),
    rejectQuote: useCallback((id) => wrap(rejectQuote, id), [wrap]),
    convertQuote: useCallback((id, dto) => wrap(convertQuote, id, dto), [wrap]),
    deleteQuote: useCallback((id) => wrap(deleteQuote, id), [wrap]),
    loading,
    error,
  };
}
