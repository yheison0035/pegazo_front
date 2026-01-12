import apiFetch from '../../auth/client';

export async function searchProducts(term) {
  if (!term || term.length < 2) return { data: [] };
  return apiFetch(`/inventory/search/${term}`);
}

export async function createSale(dto) {
  return apiFetch('/sales', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}
