import apiFetch from '../../auth/client';

export async function getMesas() {
  return apiFetch('/mesas');
}

export async function createMesa(dto) {
  return apiFetch('/mesas', { method: 'POST', body: JSON.stringify(dto) });
}

export async function updateMesa(id, dto) {
  return apiFetch(`/mesas/${id}`, { method: 'PUT', body: JSON.stringify(dto) });
}

export async function deleteMesa(id) {
  return apiFetch(`/mesas/${id}`, { method: 'DELETE' });
}
