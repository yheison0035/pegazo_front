import apiFetch from '../../auth/client';

export async function getBankStatus(localId) {
  const qs = localId ? `?localId=${Number(localId)}` : '';
  return apiFetch(`/bank/status${qs}`);
}
export async function enableBank(dto = {}) {
  return apiFetch('/bank/enable', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}
export async function setBankConfig(dto = {}) {
  return apiFetch('/bank/config', {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}
export async function disableBank(localId) {
  return apiFetch('/bank/disable', {
    method: 'POST',
    body: JSON.stringify(localId ? { localId: Number(localId) } : {}),
  });
}
export async function regenerateBankToken(localId) {
  return apiFetch('/bank/regenerate', {
    method: 'POST',
    body: JSON.stringify(localId ? { localId: Number(localId) } : {}),
  });
}
export async function testBankDeposit() {
  return apiFetch('/bank/test', { method: 'POST' });
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
export async function deleteBankDeposit(id) {
  return apiFetch(`/bank/deposits/${id}`, { method: 'DELETE' });
}
export async function clearBankDeposits() {
  return apiFetch('/bank/deposits/all', { method: 'DELETE' });
}
