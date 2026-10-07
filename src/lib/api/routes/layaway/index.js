import apiFetch from '../../auth/client';

// Planes separe (apartados).
export async function getLayaways(status = 'ACTIVO') {
  return apiFetch(`/layaway?status=${encodeURIComponent(status)}`, {
    cache: 'no-store',
  });
}

export async function getLayaway(id) {
  return apiFetch(`/layaway/${id}`, { cache: 'no-store' });
}

export async function createLayaway(dto) {
  return apiFetch('/layaway', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function addLayawayPayment(id, dto) {
  return apiFetch(`/layaway/${id}/payment`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateLayawayItems(id, dto) {
  return apiFetch(`/layaway/${id}/items`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

export async function completeLayaway(id, dto = {}) {
  return apiFetch(`/layaway/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function cancelLayaway(id) {
  return apiFetch(`/layaway/${id}/cancel`, { method: 'POST' });
}
