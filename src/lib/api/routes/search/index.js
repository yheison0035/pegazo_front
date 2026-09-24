import apiFetch from '../../auth/client';

// Buscador global (⌘K). Devuelve { term, products, customers } ya filtrados por
// local y permisos en el backend.
export async function quickSearch(term) {
  const q = new URLSearchParams({ term: term || '' });
  return apiFetch(`/search/quick?${q.toString()}`, { cache: 'no-store' });
}
