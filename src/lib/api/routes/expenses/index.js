import apiFetch from '../../auth/client';
import { parseCOPToNumber, toLocalDateTimeISO } from '../../utils/utils';

export async function getExpenses(params = {}) {
  const { page = 1, limit = 10, ...filters } = params;

  const query = new URLSearchParams();

  query.set('page', String(page));
  query.set('limit', String(limit));

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      query.set(key, String(value));
    }
  });

  return apiFetch(`/expenses?${query.toString()}`);
}

export async function getExpensesById(id) {
  return apiFetch(`/expenses/${id}`);
}

export async function createExpenses(dto) {
  const body = {
    ...dto,
    amount: parseCOPToNumber(dto.amount) || 0,
    localId: Number(dto.localId) || null,
    providerId: Number(dto.providerId) || null,
    expenseDate: toLocalDateTimeISO(dto.expenseDate) || '',
  };

  return apiFetch('/expenses', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateExpenses(id, dto) {
  const { id: _id, createdAt, updatedAt, local, provider, ...cleanDto } = dto;

  const body = {
    ...cleanDto,
    amount: parseCOPToNumber(dto.amount) || 0,
    localId: Number(dto.localId) || null,
    providerId: Number(dto.providerId) || null,
    expenseDate: toLocalDateTimeISO(dto.expenseDate) || '',
  };

  return apiFetch(`/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteExpenses(id) {
  return apiFetch(`/expenses/${id}`, { method: 'DELETE' });
}
