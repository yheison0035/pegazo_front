'use client';

import { useState } from 'react';
import {
  getMotivationMessage,
  createMotivation,
  updateMotivation,
  deleteMotivation,
} from '../motivation/index';

export default function useMotivation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const wrap = async (fn, ...args) => {
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
  };

  return {
    getMotivationMessage: () => wrap(getMotivationMessage),
    createMotivation: (dto) => wrap(createMotivation, dto),
    updateMotivation: (id, dto) => wrap(updateMotivation, id, dto),
    deleteMotivation: (id) => wrap(deleteMotivation, id),
    loading,
    error,
  };
}
