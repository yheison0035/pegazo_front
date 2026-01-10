import apiFetch from '../../auth/client';
import { toFullISO } from '../../utils/utils';

export async function getBrands() {
  return apiFetch('/brands');
}

export async function getBrandById(id) {
  return apiFetch(`/brands/${id}`);
}

export async function createBrand(dto) {
  return apiFetch('/brands', { method: 'POST', body: JSON.stringify(dto) });
}

export async function updateBrand(id, dto) {
  const { id: _id, createdAt, updatedAt, ...cleanDto } = dto;

  const body = {
    ...cleanDto,
  };

  return apiFetch(`/brands/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteBrand(id) {
  return apiFetch(`/brands/${id}`, { method: 'DELETE' });
}
