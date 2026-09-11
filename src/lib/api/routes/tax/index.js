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

// Perfil fiscal (responsabilidades del RUT).
export async function getTaxProfile() {
  return apiFetch('/tax/profile');
}
export async function updateTaxProfile(data) {
  return apiFetch('/tax/profile', { method: 'PATCH', body: JSON.stringify(data) });
}
// Magnitudes anuales (topes de renta).
export async function getTaxYear(year) {
  return apiFetch(`/tax/tax-year${qs({ year })}`);
}
export async function updateTaxYear(data) {
  return apiFetch('/tax/tax-year', { method: 'PATCH', body: JSON.stringify(data) });
}
// Obligaciones DIAN derivadas (¿debe declarar renta?).
export async function getTaxObligations(params = {}) {
  return apiFetch(`/tax/obligations${qs(params)}`);
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
