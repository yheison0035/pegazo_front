import apiFetch from '../../auth/client';

// Guarda cascos — custodia de cascos (exclusivo de este tipo de negocio).

export async function getStorage() {
  return apiFetch('/storage');
}
export async function getStorageHistory(limit = 30) {
  return apiFetch(`/storage/history?limit=${limit}`);
}
export async function getStorageSettings() {
  return apiFetch('/storage/settings');
}
export async function updateStorageSettings(dto) {
  return apiFetch('/storage/settings', {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}
export async function checkInStorage(dto) {
  return apiFetch('/storage/checkin', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}
export async function quoteStorage(id) {
  return apiFetch(`/storage/${id}/quote`);
}
export async function toggleStorageWash(id, done) {
  return apiFetch(`/storage/${id}/wash`, {
    method: 'PATCH',
    body: JSON.stringify({ done }),
  });
}
export async function checkoutStorage(id, dto) {
  return apiFetch(`/storage/${id}/checkout`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}
export async function cancelStorage(id) {
  return apiFetch(`/storage/${id}/cancel`, { method: 'POST' });
}
