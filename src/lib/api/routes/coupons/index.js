import apiFetch from '../../auth/client';

export async function getCoupons(params = {}) {
  const { page = 1, limit = 50, ...filters } = params;
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('limit', String(limit));
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) query.set(k, String(v));
  });
  return apiFetch(`/coupons?${query.toString()}`);
}

export async function createCoupon(dto) {
  return apiFetch('/coupons', { method: 'POST', body: JSON.stringify(dto) });
}

export async function updateCoupon(id, dto) {
  return apiFetch(`/coupons/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

export async function deleteCoupon(id) {
  return apiFetch(`/coupons/${id}`, { method: 'DELETE' });
}
