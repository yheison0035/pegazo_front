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
export async function getFinancials(params = {}) {
  return apiFetch(`/accounting/financials${qs(params)}`);
}
export async function getAuxiliary(params = {}) {
  return apiFetch(`/accounting/auxiliary${qs(params)}`);
}
export async function getTaxSummary(params = {}) {
  return apiFetch(`/accounting/tax-summary${qs(params)}`);
}

// Asientos manuales de la propia empresa (dueño/admin/contador interno).
export async function getEntries(params = {}) {
  return apiFetch(`/accounting/entries${qs(params)}`);
}
export async function createEntry(payload) {
  return apiFetch('/accounting/entries', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
export async function updateEntry(id, payload) {
  return apiFetch(`/accounting/entries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
export async function deleteEntry(id) {
  return apiFetch(`/accounting/entries/${id}`, { method: 'DELETE' });
}
export async function importEntries(rows) {
  return apiFetch('/accounting/entries/import', {
    method: 'POST',
    body: JSON.stringify({ rows }),
  });
}
// Documento soporte (PDF/imagen) para un asiento.
export async function uploadAccountingDoc(file) {
  const fd = new FormData();
  fd.append('file', file);
  return apiFetch('/accounting/upload', { method: 'POST', body: fd });
}
