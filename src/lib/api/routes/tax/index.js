import apiFetch from '../../auth/client';

function qs(params = {}) {
  const s = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null),
  ).toString();
  return s ? `?${s}` : '';
}

// ---- Empresa ----
export async function getTaxCalendar(params = {}) {
  return apiFetch(`/tax/calendar${qs(params)}`);
}

// ---- Plataforma ----
export async function getTaxDeadlines(year) {
  return apiFetch(`/tax/deadlines${qs({ year })}`);
}
export async function createTaxDeadline(data) {
  return apiFetch('/tax/deadlines', { method: 'POST', body: JSON.stringify(data) });
}
export async function updateTaxDeadline(id, data) {
  return apiFetch(`/tax/deadlines/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
export async function deleteTaxDeadline(id) {
  return apiFetch(`/tax/deadlines/${id}`, { method: 'DELETE' });
}
export async function getTaxParameters(year) {
  return apiFetch(`/tax/parameters${qs({ year })}`);
}
export async function upsertTaxParameter(data) {
  return apiFetch('/tax/parameters', { method: 'POST', body: JSON.stringify(data) });
}
