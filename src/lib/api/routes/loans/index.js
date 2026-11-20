import apiFetch from '../../auth/client';

// Préstamos (tipo de negocio FINANCIERA). Todas las rutas van a /loans.
// Evento para refrescar listas/KPIs cuando cambia algo (crear, abonar, anular).
export const LOANS_CHANGED_EVENT = 'pegazo:loans-changed';
export function emitLoansChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(LOANS_CHANGED_EVENT));
}

const qs = (params = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
};
const json = (method, body) => ({ method, body: JSON.stringify(body ?? {}) });

// Configuración de la empresa
export const getLoanSettings = () => apiFetch('/loans/settings');
export const updateLoanSettings = (dto) => apiFetch('/loans/settings', json('PATCH', dto));

// Productos de crédito
export const getLoanProducts = (params = {}) => apiFetch(`/loans/products${qs(params)}`);
export const createLoanProduct = (dto) => apiFetch('/loans/products', json('POST', dto));
export const updateLoanProduct = (id, dto) => apiFetch(`/loans/products/${id}`, json('PATCH', dto));
export const deleteLoanProduct = (id) => apiFetch(`/loans/products/${id}`, { method: 'DELETE' });

// Perfil crediticio del cliente
export const getCreditProfile = (customerId) => apiFetch(`/loans/customers/${customerId}/profile`);
export const saveCreditProfile = (customerId, dto) =>
  apiFetch(`/loans/customers/${customerId}/profile`, json('PUT', dto));

// Simulador (no guarda)
export const simulateLoan = (dto) => apiFetch('/loans/simulate', json('POST', dto));

// Préstamos
export const getLoans = (params = {}) => apiFetch(`/loans${qs(params)}`);
export const getLoanById = (id) => apiFetch(`/loans/${id}`);
export const createLoan = (dto) => apiFetch('/loans', json('POST', dto));
export const approveLoan = (id) => apiFetch(`/loans/${id}/approve`, json('POST'));
export const rejectLoan = (id, reason) => apiFetch(`/loans/${id}/reject`, json('POST', { reason }));
export const disburseLoan = (id, dto = {}) => apiFetch(`/loans/${id}/disburse`, json('POST', dto));
export const cancelLoan = (id, reason) => apiFetch(`/loans/${id}/cancel`, json('POST', { reason }));

// Abonos
export const addLoanPayment = (id, dto) => apiFetch(`/loans/${id}/payments`, json('POST', dto));
export const annulLoanPayment = (id, paymentId, reason) =>
  apiFetch(`/loans/${id}/payments/${paymentId}/annul`, json('POST', { reason }));
export const getLoanPaymentsHistory = (params = {}) => apiFetch(`/loans/payments/history${qs(params)}`);

// Cobrador y resumen
export const getCollectorRoute = (params = {}) => apiFetch(`/loans/collector/route${qs(params)}`);
export const getLoansSummary = (params = {}) => apiFetch(`/loans/summary${qs(params)}`);
