import apiFetch from '../../auth/client';

export async function searchProducts(term) {
  if (!term || term.length < 2) return { data: [] };
  return apiFetch(`/inventory/search/${term}`);
}

export async function createSale(dto) {
  const body = {
    ...dto,
    saleDate: dto.saleDate,
    localId: Number(dto.localId),
    customerId: Number(dto.customerId),
    userId: Number(dto.userId),
  };

  return apiFetch('/sales', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
