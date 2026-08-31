import apiFetch from '../../auth/client';

export async function getCustomerSegments() {
  return apiFetch('/customer-segments');
}

export async function createCustomerSegment(dto) {
  return apiFetch('/customer-segments', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateCustomerSegment(id, dto) {
  return apiFetch(`/customer-segments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

export async function deleteCustomerSegment(id) {
  return apiFetch(`/customer-segments/${id}`, { method: 'DELETE' });
}
