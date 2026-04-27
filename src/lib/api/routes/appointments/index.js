import apiFetch from '../../auth/client';
import { buildISODateTime } from '../../utils/utils';

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

export async function createAppointment(dto) {
  debugger;
  const body = {
    ...dto,
    serviceId: Number(dto.serviceId),
    barberId: Number(dto.barberId),
    localId: Number(dto.localId),
    customerId: dto.customerId ? Number(dto.customerId) : null,
  };

  return apiFetch('/appointments', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateAppointment(id, dto) {
  const {
    id: _id,
    createdAt,
    updatedAt,
    manager,
    userId,
    users,
    companyId,
    ...cleanDto
  } = dto;

  const body = {
    ...cleanDto,
    managerId: Number(cleanDto.managerId) || null,
  };

  return apiFetch(`/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteAppointment(id) {
  return apiFetch(`/appointments/${id}`, {
    method: 'DELETE',
  });
}

export async function getAvailability(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      query.set(key, String(value));
    }
  });

  const res = await apiFetch(`/appointments/availability?${query.toString()}`);

  return Array.isArray(res) ? res : res.data || [];
}
