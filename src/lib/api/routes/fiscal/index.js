import apiFetch from '../../auth/client';

// Facturación electrónica DIAN (integración propia vía Pegazo Fiscal API).

export async function getFiscalStatus() {
  return apiFetch('/fiscal/status');
}

export async function setupFiscal() {
  return apiFetch('/fiscal/setup', { method: 'POST' });
}

export async function addFiscalResolution(dto) {
  return apiFetch('/fiscal/resolutions', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function getFiscalDocuments(params = {}) {
  const q = new URLSearchParams();
  const { page = 1, limit = 20, ...filters } = params;
  q.set('page', String(page));
  q.set('limit', String(limit));
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== '' && v != null) q.set(k, String(v));
  });
  return apiFetch(`/fiscal/documents?${q.toString()}`);
}

export async function getFiscalStats() {
  return apiFetch('/fiscal/stats');
}

export async function emitFiscalInvoice(saleId) {
  return apiFetch(`/fiscal/emit/${saleId}`, { method: 'POST' });
}

// Emite una factura de prueba (datos de ejemplo) para validar el flujo.
export async function emitFiscalTestInvoice() {
  return apiFetch('/fiscal/test-invoice', { method: 'POST' });
}

// Devuelve el HTML de la representación gráfica (para mostrar en un iframe).
// apiFetch devuelve el texto crudo cuando la respuesta no es JSON.
export async function getFiscalRepresentation(id) {
  return apiFetch(`/fiscal/documents/${id}/representation`);
}
