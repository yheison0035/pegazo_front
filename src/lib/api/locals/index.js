import apiFetch from '../auth/client';
import { toFullISO } from '../utils/utils';

export async function getLocals() {
  return apiFetch('/customers');
}

export async function getLocalById(id) {
  return apiFetch(`/customers/${id}`);
}

export async function createLocal(dto) {
  const body = {
    ...dto,
    birthdate: dto.birthdate ? toFullISO(dto.birthdate) : undefined,
    advisorId: Number(dto.advisorId),
    stateId: Number(dto.stateId),
  };
  return apiFetch('/customers', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateLocal(id, dto) {
  const {
    id: _id,
    createdAt,
    updatedAt,
    advisor,
    comments,
    state,
    ...cleanDto
  } = dto;

  const body = {
    ...cleanDto,
    stateId: Number(cleanDto.stateId) || null,
    advisorId: Number(cleanDto.advisorId) || null,
    birthdate: cleanDto.birthdate ? toFullISO(cleanDto.birthdate) : undefined,
  };

  return apiFetch(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteLocal(id) {
  return apiFetch(`/customers/${id}`, { method: 'DELETE' });
}
