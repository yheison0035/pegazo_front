import apiFetch from '../../auth/client';

export async function getBankStatus() {
  return apiFetch('/bank/status');
}
export async function enableBank() {
  return apiFetch('/bank/enable', { method: 'POST' });
}
export async function disableBank() {
  return apiFetch('/bank/disable', { method: 'POST' });
}
export async function regenerateBankToken() {
  return apiFetch('/bank/regenerate', { method: 'POST' });
}
export async function getBankDeposits(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/bank/deposits${qs ? `?${qs}` : ''}`);
}
export async function getPendingBankDeposits() {
  return apiFetch('/bank/deposits/pending');
}
export async function markBankDepositSeen(id) {
  return apiFetch(`/bank/deposits/${id}/seen`, { method: 'PATCH' });
}
export async function markAllBankSeen() {
  return apiFetch('/bank/deposits/seen-all', { method: 'PATCH' });
}
