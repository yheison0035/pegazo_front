import apiFetch from '../../auth/client';

// Crea una solicitud de disminución de stock (roles sin permiso para bajar).
export async function createStockRequest(dto) {
  return apiFetch('/stock-requests', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

// Lista para el aprobador (dueño/admin). status: PENDING | APPROVED | REJECTED
export async function getStockRequests(status) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiFetch(`/stock-requests${qs}`);
}

export async function getPendingStockRequestCount() {
  return apiFetch('/stock-requests/pending-count');
}

export async function getMyStockRequests() {
  return apiFetch('/stock-requests/mine');
}

export async function approveStockRequest(id, note) {
  return apiFetch(`/stock-requests/${id}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({ note: note || undefined }),
  });
}

export async function rejectStockRequest(id, note) {
  return apiFetch(`/stock-requests/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ note: note || undefined }),
  });
}
