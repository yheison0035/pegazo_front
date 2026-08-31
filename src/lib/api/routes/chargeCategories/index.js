import apiFetch from '../../auth/client';

export async function getChargeCategories() {
  return apiFetch('/charge-categories');
}

export async function createChargeCategory(dto) {
  return apiFetch('/charge-categories', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateChargeCategory(id, dto) {
  return apiFetch(`/charge-categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

export async function deleteChargeCategory(id) {
  return apiFetch(`/charge-categories/${id}`, { method: 'DELETE' });
}
