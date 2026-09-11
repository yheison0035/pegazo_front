import apiFetch from '../../auth/client';

function qs(params = {}) {
  const s = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null),
  ).toString();
  return s ? `?${s}` : '';
}

// Contabilidad · libros derivados de la operación.
export async function getJournal(params = {}) {
  return apiFetch(`/accounting/journal${qs(params)}`);
}
export async function getLedger(params = {}) {
  return apiFetch(`/accounting/ledger${qs(params)}`);
}
