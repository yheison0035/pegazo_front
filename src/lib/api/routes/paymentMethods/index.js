import apiFetch from '../../auth/client';

export async function getPaymentMethodCatalog() {
  return apiFetch('/payment-methods');
}

export async function createPaymentMethod(dto) {
  return apiFetch('/payment-methods', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updatePaymentMethod(id, dto) {
  return apiFetch(`/payment-methods/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

export async function deletePaymentMethod(id) {
  return apiFetch(`/payment-methods/${id}`, { method: 'DELETE' });
}
