import apiFetch from '../../auth/client';

export async function getCustomers(params = {}) {
  const { page = 1, limit = 10, ...filters } = params;

  const query = new URLSearchParams();

  query.set('page', String(page));
  query.set('limit', String(limit));

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      query.set(key, String(value));
    }
  });

  return apiFetch(`/customers?${query.toString()}`);
}

export async function getCustomerById(id) {
  return apiFetch(`/customers/${id}`);
}

export async function createCustomer(dto) {
  const body = {
    ...dto,
    localId: Number(dto.localId),
  };
  return apiFetch('/customers', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateCustomer(id, dto) {
  const { id: _id, createdAt, updatedAt, local, companyId, ...cleanDto } = dto;

  const body = {
    ...cleanDto,
    localId: Number(cleanDto.localId) || null,
  };

  return apiFetch(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteCustomer(id) {
  return apiFetch(`/customers/${id}`, { method: 'DELETE' });
}
