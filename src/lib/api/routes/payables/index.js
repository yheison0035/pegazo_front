import apiFetch from '../../auth/client';

function qs(params = {}) {
  const q = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null),
  ).toString();
  return q ? `?${q}` : '';
}

export async function getPayables(params = {}) {
  return apiFetch(`/payables${qs(params)}`);
}
export async function getPayablesSummary() {
  return apiFetch('/payables/summary');
}
export async function createPayable(dto) {
  return apiFetch('/payables', { method: 'POST', body: JSON.stringify(dto) });
}
export async function payPayable(id, dto) {
  return apiFetch(`/payables/${id}/pay`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}
export async function unpayPayable(id) {
  return apiFetch(`/payables/${id}/unpay`, { method: 'PATCH' });
}
export async function updatePayable(id, dto) {
  return apiFetch(`/payables/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}
export async function deletePayable(id) {
  return apiFetch(`/payables/${id}`, { method: 'DELETE' });
}
