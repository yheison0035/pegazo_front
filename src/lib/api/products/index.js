import apiFetch from '../auth/client';
import { toFullISO } from '../utils/utils';

export async function getProducts() {
  return apiFetch('/customers');
}

export async function getProductById(id) {
  return apiFetch(`/customers/${id}`);
}

export async function createProduct(dto) {
  const body = {
    ...dto,
    birthdate: dto.birthdate ? toFullISO(dto.birthdate) : undefined,
    advisorId: Number(dto.advisorId),
    stateId: Number(dto.stateId),
  };
  return apiFetch('/customers', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateProduct(id, dto) {
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

export async function deleteProduct(id) {
  return apiFetch(`/customers/${id}`, { method: 'DELETE' });
}

export async function importProducts(file) {
  const fd = new FormData();
  fd.append('file', file);
  return apiFetch('/customers/import', { method: 'POST', body: fd });
}
