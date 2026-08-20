import apiFetch from '../../auth/client';

// Pedidos = ventas de la tienda online (source ECOMMERCE), gestionados aparte.
export async function getOrders(params = {}) {
  const { page = 1, limit = 10, ...filters } = params;

  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('limit', String(limit));

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      query.set(key, String(value));
    }
  });

  return apiFetch(`/sales/orders/list?${query.toString()}`);
}

export async function getOrderById(id) {
  return apiFetch(`/sales/orders/${id}`);
}

// Actualiza estado de envío + datos de la guía (transportadora, número…).
export async function updateOrderFulfillment(id, dto) {
  return apiFetch(`/sales/orders/${id}/fulfillment`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}
