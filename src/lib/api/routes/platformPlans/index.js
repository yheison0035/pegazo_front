import apiFetch from '../../auth/client';

// Configuración de planes (SUPER_PLATFORM).

export async function getPlatformPlans() {
  return apiFetch('/platform/plans');
}

export async function updatePlatformPlan(id, dto) {
  return apiFetch(`/platform/plans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

export async function createPlatformPlan(dto) {
  return apiFetch('/platform/plans', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

// gates = { moduleKey: 'IMPULSO' | 'BASE' | ... }
export async function setPlatformPlanGates(gates) {
  return apiFetch('/platform/plans/gates', {
    method: 'PUT',
    body: JSON.stringify({ gates }),
  });
}
