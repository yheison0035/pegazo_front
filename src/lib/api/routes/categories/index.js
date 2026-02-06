import apiFetch from '../../auth/client';

export async function getCategories(params = {}) {
  const { page = 1, limit = 10, ...filters } = params;

  const query = new URLSearchParams();

  query.set('page', String(page));
  query.set('limit', String(limit));

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      query.set(key, String(value));
    }
  });

  return apiFetch(`/categories?${query.toString()}`);
}

export async function getCategoryById(id) {
  return apiFetch(`/categories/${id}`);
}

export async function createCategory(dto) {
  const body = {
    ...dto,
    localId: Number(dto.localId) || null,
  };

  return apiFetch('/categories', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateCategory(id, dto) {
  const { id: _id, createdAt, updatedAt, local, ...cleanDto } = dto;

  const body = {
    ...cleanDto,
    localId: Number(cleanDto.localId) || null,
  };

  return apiFetch(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteCategory(id) {
  return apiFetch(`/categories/${id}`, { method: 'DELETE' });
}
