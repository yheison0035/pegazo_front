import apiFetch from '../../auth/client';

// Contabilidad · Plan de cuentas (PUC).
export async function getLedgerAccounts() {
  return apiFetch('/ledger-accounts');
}
export async function createLedgerAccount(data) {
  return apiFetch('/ledger-accounts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
export async function updateLedgerAccount(id, data) {
  return apiFetch(`/ledger-accounts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
export async function deleteLedgerAccount(id) {
  return apiFetch(`/ledger-accounts/${id}`, { method: 'DELETE' });
}
