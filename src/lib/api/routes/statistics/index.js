import apiFetch from '../../auth/client';

export async function getDashboardStats(dto = {}) {
  return apiFetch('/statistics/dashboard', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}
