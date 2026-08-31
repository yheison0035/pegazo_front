import apiFetch from '../../auth/client';
import { buildISODateTime } from '../../utils/utils';

// Avisa a la app (campana/agenda) que las citas cambiaron para refrescar en el
// acto, sin esperar al polling.
function notifyAppointmentsChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pegazo:appointments-changed'));
  }
}

export async function getAppointments(params = {}) {
  const { page = 1, limit = 10, ...filters } = params;

  const query = new URLSearchParams();

  query.set('page', String(page));
  query.set('limit', String(limit));

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      query.set(key, String(value));
    }
  });

  return apiFetch(`/appointments?${query.toString()}`);
}

export async function getAppointmentById(id) {
  return apiFetch(`/appointments/${id}`);
}

// Agenda de hoy y mañana (para el modal de inicio y los recordatorios).
export async function getAppointmentsAgenda() {
  return apiFetch('/appointments/agenda');
}

// Mis citas por rango: 'today' | 'tomorrow' | 'week' | 'month'.
export async function getMyAppointments(range = 'today') {
  return apiFetch(`/appointments/mine?range=${encodeURIComponent(range)}`);
}

export async function createAppointment(dto) {
  const body = {
    ...dto,
    serviceId: Number(dto.serviceId),
    barberId: Number(dto.barberId),
    localId: Number(dto.localId),
    customerId: dto.customerId ? Number(dto.customerId) : null,
  };

  const res = await apiFetch('/appointments', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  notifyAppointmentsChanged();
  return res;
}

export async function updateAppointment(id, dto) {
  const body = {
    date: dto.date,
    startTime: dto.startTime,
    serviceId: Number(dto.serviceId),
    barberId: Number(dto.barberId),
    // Cliente opcional: si va vacío se manda null (evita FK a id 0).
    customerId: dto.customerId ? Number(dto.customerId) : null,
    localId: Number(dto.localId),
    notes: dto.notes || '',
    status: dto.status,
  };

  const res = await apiFetch(`/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  notifyAppointmentsChanged();
  return res;
}

// Marca (o desmarca) la cita como confirmada con el cliente.
export async function setAppointmentClientConfirmed(id, confirmed = true) {
  const res = await apiFetch(`/appointments/${id}/client-confirm`, {
    method: 'PATCH',
    body: JSON.stringify({ confirmed }),
  });
  notifyAppointmentsChanged();
  return res;
}

export async function deleteAppointment(id) {
  const res = await apiFetch(`/appointments/${id}`, {
    method: 'DELETE',
  });
  notifyAppointmentsChanged();
  return res;
}

// Citas de un mes para la vista de calendario: { year, month(0-11), barberId? }
export async function getAppointmentsMonth(params = {}) {
  const q = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null),
  ).toString();
  return apiFetch(`/appointments/month?${q}`);
}

export async function getAvailability(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      query.set(key, String(value));
    }
  });

  const res = await apiFetch(`/appointments/availability?${query.toString()}`);

  // Nuevo formato: { off, reason, slots }. Se mantiene compatibilidad si en algún
  // punto llega un arreglo plano.
  if (Array.isArray(res)) {
    return { off: false, reason: null, slots: res };
  }
  return {
    off: !!res?.off,
    reason: res?.reason || null,
    slots: res?.slots || res?.data || [],
  };
}
