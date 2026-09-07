import apiFetch from '../../auth/client';

// Membresías / mensualidades recurrentes por cliente.

export async function getMemberships() {
  return apiFetch('/memberships');
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
