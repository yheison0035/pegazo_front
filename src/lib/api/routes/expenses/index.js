import apiFetch from '../../auth/client';
import { parseCOPToNumber } from '../../utils/utils';

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
    // La categoría (tipo de gasto) debe ir como entero, no como texto.
    expenseCategoryId: dto.expenseCategoryId
      ? Number(dto.expenseCategoryId)
      : undefined,
    expenseDate: new Date(dto.expenseDate) || '',
  };
  // El enum `type` lo deriva el backend desde la categoría; no enviarlo vacío
  // (un '' rompe la validación @IsEnum).
  if (!body.type) delete body.type;

  return apiFetch('/expenses', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateExpenses(id, dto) {
  const {
    id: _id,
    createdAt,
    updatedAt,
    local,
    provider,
    expenseCategory,
    ...cleanDto
  } = dto;

  const body = {
    ...cleanDto,
    amount: parseCOPToNumber(dto.amount) || 0,
    localId: Number(dto.localId) || null,
    providerId: Number(dto.providerId) || null,
    expenseCategoryId: dto.expenseCategoryId
      ? Number(dto.expenseCategoryId)
      : undefined,
    expenseDate: new Date(dto.expenseDate) || '',
  };
  if (!body.type) delete body.type;

  return apiFetch(`/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteExpenses(id) {
  return apiFetch(`/expenses/${id}`, { method: 'DELETE' });
}
