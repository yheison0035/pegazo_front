import apiFetch from '../../auth/client';

export async function getBrands(params = {}) {
  const { page = 1, limit = 10, ...filters } = params;

  const query = new URLSearchParams();

  query.set('page', String(page));
  query.set('limit', String(limit));

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      query.set(key, String(value));
    }
  });

  return apiFetch(`/brands?${query.toString()}`);
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
