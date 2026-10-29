import apiFetch from '../../auth/client';

// Contabilidad · Activos fijos.
export async function getAssets(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null),
  ).toString();
  return apiFetch(`/assets${qs ? `?${qs}` : ''}`);
}

export async function createAsset(data) {
  return apiFetch('/assets', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateAsset(id, data) {
  return apiFetch(`/assets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// Baja o venta del activo (deja de depreciarse en esa fecha).
export async function disposeAsset(id, data) {
  return apiFetch(`/assets/${id}/dispose`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteAsset(id) {
  return apiFetch(`/assets/${id}`, { method: 'DELETE' });
}

// Importar activos desde Excel/CSV (una fila = un activo).
export async function importAssets(rows) {
  return apiFetch('/assets/import', {
    method: 'POST',
    body: JSON.stringify({ rows }),
  });
}
