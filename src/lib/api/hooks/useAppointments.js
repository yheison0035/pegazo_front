'use client';

import { useState, useCallback } from 'react';
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAvailability,
} from '../routes/appointments/index';

export default function useAppointments() {
  const [loading, setLoading] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
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

  const getAppointmentsFn = useCallback(
    (params) => wrap(getAppointments, params),
    [wrap]
  );

  const getAppointmentByIdFn = useCallback(
    (id) => wrap(getAppointmentById, id),
    [wrap]
  );

  const createAppointmentFn = useCallback(
    (dto) => wrap(createAppointment, dto),
    [wrap]
  );

  const updateAppointmentFn = useCallback(
    (id, dto) => wrap(updateAppointment, id, dto),
    [wrap]
  );

  const deleteAppointmentFn = useCallback(
    (id) => wrap(deleteAppointment, id),
    [wrap]
  );

  const getAvailabilityFn = useCallback(async (params) => {
    setAvailabilityLoading(true);
    try {
      return await getAvailability(params);
    } catch (err) {
      console.error(err);
      return { off: false, reason: null, slots: [] };
    } finally {
      setAvailabilityLoading(false);
    }
  }, []);

  return {
    getAppointments: getAppointmentsFn,
    getAppointmentById: getAppointmentByIdFn,
    createAppointment: createAppointmentFn,
    updateAppointment: updateAppointmentFn,
    deleteAppointment: deleteAppointmentFn,

    getAvailability: getAvailabilityFn,

    loading,
    availabilityLoading,
    error,
  };
}
