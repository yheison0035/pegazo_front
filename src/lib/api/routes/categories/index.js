import apiFetch from '../../auth/client';
import { toFullISO } from '../../utils/utils';

export async function getCategories() {
  return apiFetch('/categories');
}

export async function getCategoryById(id) {
  return apiFetch(`/categories/${id}`);
}

export async function createCategory(dto) {
  return apiFetch('/categories', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateCategory(id, dto) {
  const { id: _id, createdAt, updatedAt, ...cleanDto } = dto;

  const body = {
    ...cleanDto,
  };

  return apiFetch(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteCategory(id) {
  return apiFetch(`/categories/${id}`, { method: 'DELETE' });
}
