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
// Detalle de un periodo: period = 'today' | 'week' | 'month'.
export async function getMyDetail(period = 'today') {
  return apiFetch(`/statistics/my-detail?period=${period}`);
}
// Historial: group = 'week' | 'month'.
export async function getMyHistory(group = 'week') {
  return apiFetch(`/statistics/my-history?group=${group}`);
}

export async function getDashboardStats(dto = {}) {
  return apiFetch('/statistics/dashboard', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

// Comparación entre dos periodos: { periodA:{startDate,endDate}, periodB:{...}, localId }
export async function getCompareStats(dto = {}) {
  return apiFetch('/statistics/compare', {
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
