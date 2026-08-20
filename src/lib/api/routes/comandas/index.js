import apiFetch from '../../auth/client';

export async function createComanda(dto) {
  return apiFetch('/comandas', { method: 'POST', body: JSON.stringify(dto) });
}

export async function addComandaItems(id, items) {
  return apiFetch(`/comandas/${id}/items`, {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export async function getKitchen() {
  return apiFetch('/comandas/kitchen');
}

export async function getComandasByMesa(mesaId) {
  return apiFetch(`/comandas/mesa/${mesaId}`);
}

export async function setComandaStatus(id, status) {
  return apiFetch(`/comandas/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function chargeComanda(id, dto) {
  return apiFetch(`/comandas/${id}/charge`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}
