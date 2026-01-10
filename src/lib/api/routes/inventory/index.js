import apiFetch from '../../auth/client';
import { toFullISO } from '../../utils/utils';

export async function getProducts() {
  return apiFetch('/inventory');
}

export async function getProductById(id) {
  return apiFetch(`/inventory/${id}`);
}

export async function createProduct(dto) {
  debugger;
  const body = {
    ...dto,
    birthdate: dto.birthdate ? toFullISO(dto.birthdate) : undefined,
    advisorId: Number(dto.advisorId),
    stateId: Number(dto.stateId),
  };
  return apiFetch('/inventory', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateProduct(id, dto) {
  debugger;
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

  return apiFetch(`/inventory/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteProduct(id) {
  return apiFetch(`/inventory/${id}`, { method: 'DELETE' });
}
