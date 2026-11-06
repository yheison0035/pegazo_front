import apiFetch from '../../auth/client';

// Membresías / mensualidades recurrentes por cliente.

export async function getMemberships(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) q.set(k, String(v));
  });
  const qs = q.toString();
  return apiFetch(`/memberships${qs ? `?${qs}` : ''}`);
}

export async function createMembership(dto) {
  return apiFetch('/memberships', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateMembership(id, dto) {
  return apiFetch(`/memberships/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export async function deleteMembership(id) {
  return apiFetch(`/memberships/${id}`, { method: 'DELETE' });
}

// Cobrar la mensualidad del mes (fecha + observación).
export async function chargeMembership(id, dto) {
  return apiFetch(`/memberships/${id}/charge`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

// Deshacer el cobro del mes actual.
export async function unchargeMembership(id) {
  return apiFetch(`/memberships/${id}/uncharge`, { method: 'POST' });
}
