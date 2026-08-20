import apiFetch from '../../auth/client';

export async function getPurchases(params = {}) {
  const { page = 1, limit = 10, ...filters } = params;
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('limit', String(limit));
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) query.set(k, String(v));
  });
  return apiFetch(`/purchases?${query.toString()}`);
}

export async function getPurchaseById(id) {
  return apiFetch(`/purchases/${id}`);
}

export async function createPurchase(dto) {
  return apiFetch('/purchases', { method: 'POST', body: JSON.stringify(dto) });
}

export async function receivePurchase(id) {
  return apiFetch(`/purchases/${id}/receive`, { method: 'PATCH' });
}

export async function cancelPurchase(id) {
  return apiFetch(`/purchases/${id}/cancel`, { method: 'PATCH' });
}
