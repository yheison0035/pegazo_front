import apiFetch from '../../auth/client';

export async function getCategories() {
  return apiFetch('/categories');
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
