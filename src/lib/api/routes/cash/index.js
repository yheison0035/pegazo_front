import apiFetch from '../../auth/client';

export async function getCurrentCash(localId) {
  return apiFetch(`/cash/current?localId=${localId}`);
}

export async function getCashHistory(params = {}) {
  const { page = 1, limit = 10, ...filters } = params;
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('limit', String(limit));
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) query.set(k, String(v));
  });
  return apiFetch(`/cash?${query.toString()}`);
}

export async function openCash(dto) {
  return apiFetch('/cash/open', { method: 'POST', body: JSON.stringify(dto) });
}

export async function addCashMovement(id, dto) {
  return apiFetch(`/cash/${id}/movement`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function closeCash(id, dto) {
  return apiFetch(`/cash/${id}/close`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function reopenCash(id) {
  return apiFetch(`/cash/${id}/reopen`, { method: 'POST' });
}

// Corregir la base inicial de una caja abierta (roles de caja).
export async function updateCashOpening(id, openingAmount) {
  return apiFetch(`/cash/${id}/opening`, {
    method: 'PATCH',
    body: JSON.stringify({ openingAmount }),
  });
}

// Eliminar/reiniciar una caja (dueño/admin).
export async function deleteCash(id) {
  return apiFetch(`/cash/${id}`, { method: 'DELETE' });
}
