import apiFetch from '../../auth/client';

export async function getSupplies(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/supplies${qs ? `?${qs}` : ''}`);
}

export async function createSupply(dto) {
  return apiFetch('/supplies', { method: 'POST', body: JSON.stringify(dto) });
}

export async function updateSupply(id, dto) {
  return apiFetch(`/supplies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

export async function deleteSupply(id) {
  return apiFetch(`/supplies/${id}`, { method: 'DELETE' });
}

export async function adjustSupply(id, dto) {
  return apiFetch(`/supplies/${id}/adjust`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function getSupplyMovements(id) {
  return apiFetch(`/supplies/${id}/movements`);
}
