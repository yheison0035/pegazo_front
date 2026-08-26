import apiFetch from '../../auth/client';

// Resumen ligero para el Home (ventas de hoy + estado de configuración).
export async function getHomeSummary() {
  return apiFetch('/statistics/home');
}

// Serie de ventas para la gráfica del Home: period = 'week' | 'month' | 'year'.
// offset = cuántos periodos hacia atrás (0 = actual).
export async function getSalesTrend(period = 'week', offset = 0) {
  return apiFetch(`/statistics/sales-trend?period=${period}&offset=${offset}`);
}

// "Mi rendimiento" del empleado que consulta (solo lo suyo).
export async function getMyPerformance() {
  return apiFetch('/statistics/my-performance');
}
export async function getMyWeeklyHistory() {
  return apiFetch('/statistics/my-weekly-history');
}

export async function getDashboardStats(dto = {}) {
  return apiFetch('/statistics/dashboard', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

// Reporte de IVA (generado vs descontable) de un periodo.
export async function getTaxReport(dto = {}) {
  return apiFetch('/statistics/tax-report', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}
