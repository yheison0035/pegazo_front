import apiFetch from '../../auth/client';

export async function getCustomers() {
  return apiFetch('/customers');
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
  const { id: _id, createdAt, updatedAt, local, ...cleanDto } = dto;

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
