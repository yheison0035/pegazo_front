import apiFetch from '../../auth/client';

// Aviso global de que una venta cambió (creada/anulada/editada/abono). Los
// módulos que muestran datos derivados de ventas —fidelización, detalle de
// cliente, cartera, etc.— lo escuchan para refrescar EN TIEMPO REAL.
export const SALES_CHANGED_EVENT = 'pegazo:sales-changed';
export function notifySalesChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SALES_CHANGED_EVENT));
  }
}

// Lista/busca ventas (para elegir una, p. ej. al hacer una devolución).
export async function getSales(params = {}) {
  const { page = 1, limit = 10, ...filters } = params;
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('limit', String(limit));
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) query.set(k, String(v));
  });
  return apiFetch(`/sales?${query.toString()}`);
}

export async function searchProducts(term) {
  if (!term || term.length < 2) return { data: [] };
  return apiFetch(`/inventory/search/${term}`);
}

// ---------- Cartera / fiado (abonos) ----------

// Lista la cartera (ventas a crédito con saldo pendiente). Opcional por cliente.
export async function getReceivables(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) query.set(k, String(v));
  });
  const qs = query.toString();
  return apiFetch(`/sales/receivables/list${qs ? `?${qs}` : ''}`);
}

// Abonos + saldo de una venta.
export async function getSalePayments(saleId) {
  return apiFetch(`/sales/${saleId}/payments`);
}

// Historial de todos los créditos (activos + pagados).
export async function getCreditsHistory(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) query.set(k, String(v));
  });
  const qs = query.toString();
  return apiFetch(`/sales/credits/history${qs ? `?${qs}` : ''}`);
}

// Historial de abonos (movimientos de cartera) de la empresa.
export async function getPaymentsHistory(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) query.set(k, String(v));
  });
  const qs = query.toString();
  return apiFetch(`/sales/payments/history${qs ? `?${qs}` : ''}`);
}

// Registra un abono (pago parcial) contra una venta a crédito.
export async function addSalePayment(saleId, dto) {
  const res = await apiFetch(`/sales/${saleId}/payments`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  notifySalesChanged();
  return res;
}

export async function createSale(dto) {
  const body = {
    ...dto,
    saleDate: new Date(dto.saleDate),
    localId: Number(dto.localId),
    // Cliente opcional: vacío => null (el backend asigna Consumidor Final).
    customerId: dto.customerId ? Number(dto.customerId) : null,
    userId: Number(dto.userId),
  };

  const res = await apiFetch('/sales', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  notifySalesChanged();
  return res;
}
