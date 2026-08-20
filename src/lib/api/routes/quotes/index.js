import apiFetch from '../../auth/client';

export async function getQuotes(params = {}) {
  const { page = 1, limit = 10, ...filters } = params;
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('limit', String(limit));
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) query.set(k, String(v));
  });
  return apiFetch(`/quotes?${query.toString()}`);
}

export async function getQuoteById(id) {
  return apiFetch(`/quotes/${id}`);
}

export async function createQuote(dto) {
  return apiFetch('/quotes', { method: 'POST', body: JSON.stringify(dto) });
}

export async function acceptQuote(id) {
  return apiFetch(`/quotes/${id}/accept`, { method: 'PATCH' });
}

export async function rejectQuote(id) {
  return apiFetch(`/quotes/${id}/reject`, { method: 'PATCH' });
}

export async function convertQuote(id, dto = {}) {
  return apiFetch(`/quotes/${id}/convert`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function deleteQuote(id) {
  return apiFetch(`/quotes/${id}`, { method: 'DELETE' });
}
