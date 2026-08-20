import apiFetch from '../../auth/client';

// Lista/busca ventas (para elegir una, p. ej. al hacer una devolución).
export async function getSales(params = {}) {
  const { page = 1, limit = 10, ...filters } = params;
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('limit', String(limit));
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) query.set(k, String(v));
  });
  return apiFetch(`/sales?${query.toString()}`);
}

export async function searchProducts(term) {
  if (!term || term.length < 2) return { data: [] };
  return apiFetch(`/inventory/search/${term}`);
}

export async function createSale(dto) {
  const body = {
    ...dto,
    saleDate: new Date(dto.saleDate),
    localId: Number(dto.localId),
    // Cliente opcional: vacío => null (el backend asigna Consumidor Final).
    customerId: dto.customerId ? Number(dto.customerId) : null,
    userId: Number(dto.userId),
  };

  return apiFetch('/sales', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
