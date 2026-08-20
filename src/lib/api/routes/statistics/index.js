import apiFetch from '../../auth/client';

// Resumen ligero para el Home (ventas de hoy + estado de configuración).
export async function getHomeSummary() {
  return apiFetch('/statistics/home');
}

export async function getDashboardStats(dto = {}) {
  return apiFetch('/statistics/dashboard', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}
