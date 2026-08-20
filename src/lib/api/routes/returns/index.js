import apiFetch from '../../auth/client';

export async function getReturns(params = {}) {
  const { page = 1, limit = 10, ...filters } = params;
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('limit', String(limit));
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) query.set(k, String(v));
  });
  return apiFetch(`/returns?${query.toString()}`);
}

export async function getReturnById(id) {
  return apiFetch(`/returns/${id}`);
}

export async function getSaleForReturn(saleId) {
  return apiFetch(`/returns/sale/${saleId}`);
}

export async function createReturn(dto) {
  return apiFetch('/returns', { method: 'POST', body: JSON.stringify(dto) });
}
