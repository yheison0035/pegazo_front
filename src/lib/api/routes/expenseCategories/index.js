import apiFetch from '../../auth/client';

export async function getExpenseCategories() {
  return apiFetch('/expense-categories');
}

export async function createExpenseCategory(dto) {
  return apiFetch('/expense-categories', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateExpenseCategory(id, dto) {
  return apiFetch(`/expense-categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

export async function deleteExpenseCategory(id) {
  return apiFetch(`/expense-categories/${id}`, { method: 'DELETE' });
}
