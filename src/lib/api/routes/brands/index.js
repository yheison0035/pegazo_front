import apiFetch from '../../auth/client';
import { toFullISO } from '../../utils/utils';

export async function getBrands() {
  return apiFetch('/brands');
}

export async function getBrandById(id) {
  return apiFetch(`/brands/${id}`);
}

export async function createBrand(dto) {
  const body = {
    ...dto,
    localId: Number(dto.localId) || null,
  };
  return apiFetch('/brands', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateBrand(id, dto) {
  const { id: _id, createdAt, updatedAt, local, ...cleanDto } = dto;

  const body = {
    ...cleanDto,
    localId: Number(cleanDto.localId) || null,
  };

  return apiFetch(`/brands/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteBrand(id) {
  return apiFetch(`/brands/${id}`, { method: 'DELETE' });
}
