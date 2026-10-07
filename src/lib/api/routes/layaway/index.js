import apiFetch from '../../auth/client';

// Planes separe (apartados) = ventas con paymentStatus=PLAN_SEPARE. Se crean
// desde "Realizar factura" (tipo: Plan separe). Este módulo solo los lista,
// abona, entrega y anula.
export async function getLayaways(query = {}) {
  const qs = new URLSearchParams(
    Object.entries(query).filter(([, v]) => v != null && v !== ''),
  ).toString();
  return apiFetch(`/sales/layaway/list${qs ? `?${qs}` : ''}`, {
    cache: 'no-store',
  });
}

// Abona a un plan separe. Si el abono deja saldo 0, el back lo ENTREGA
// automáticamente (descuenta stock y lo mueve a Ventas realizadas).
export async function addLayawayPayment(id, dto) {
  return apiFetch(`/sales/${id}/payments`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

// Entrega manual (botón "Entregar ahora"). force=true entrega aún con saldo.
export async function completeLayaway(id, dto = {}) {
  return apiFetch(`/sales/${id}/complete-layaway`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function cancelLayaway(id) {
  return apiFetch(`/sales/${id}/cancel-layaway`, { method: 'POST' });
}
