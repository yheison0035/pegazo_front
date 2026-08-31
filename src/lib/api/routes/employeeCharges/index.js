import apiFetch from '../../auth/client';

export async function getEmployeeCharges(params = {}) {
  const q = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null),
  ).toString();
  return apiFetch(`/employee-charges${q ? `?${q}` : ''}`);
}

export async function getEmployeeChargesSummary(userId) {
  const q = userId ? `?userId=${userId}` : '';
  return apiFetch(`/employee-charges/summary${q}`);
}

export async function createEmployeeCharge(dto) {
  return apiFetch('/employee-charges', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function settleEmployeeCharge(id, method, settledAt) {
  return apiFetch(`/employee-charges/${id}/settle`, {
    method: 'PATCH',
    body: JSON.stringify({ method, settledAt }),
  });
}

export async function unsettleEmployeeCharge(id) {
  return apiFetch(`/employee-charges/${id}/unsettle`, { method: 'PATCH' });
}

export async function deleteEmployeeCharge(id) {
  return apiFetch(`/employee-charges/${id}`, { method: 'DELETE' });
}
