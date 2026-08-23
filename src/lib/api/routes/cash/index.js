import apiFetch from '../../auth/client';

// Aviso global de que la caja cambió (abrir/cerrar/reabrir/eliminar/movimiento):
// el DayBanner y el POS lo escuchan para refrescar el estado del día EN TIEMPO
// REAL, sin recargar la página.
export const CASH_CHANGED_EVENT = 'pegazo:cash-changed';
export function notifyCashChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CASH_CHANGED_EVENT));
  }
}

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
  const res = await apiFetch('/cash/open', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  notifyCashChanged();
  return res;
}

export async function addCashMovement(id, dto) {
  const res = await apiFetch(`/cash/${id}/movement`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  notifyCashChanged();
  return res;
}

export async function closeCash(id, dto) {
  const res = await apiFetch(`/cash/${id}/close`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  notifyCashChanged();
  return res;
}

export async function reopenCash(id) {
  const res = await apiFetch(`/cash/${id}/reopen`, { method: 'POST' });
  notifyCashChanged();
  return res;
}

// Corregir la base inicial de una caja abierta (roles de caja).
export async function updateCashOpening(id, openingAmount) {
  const res = await apiFetch(`/cash/${id}/opening`, {
    method: 'PATCH',
    body: JSON.stringify({ openingAmount }),
  });
  notifyCashChanged();
  return res;
}

// Eliminar/reiniciar una caja (dueño/admin).
export async function deleteCash(id) {
  const res = await apiFetch(`/cash/${id}`, { method: 'DELETE' });
  notifyCashChanged();
  return res;
}
