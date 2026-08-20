import apiFetch from '../../auth/client';

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
