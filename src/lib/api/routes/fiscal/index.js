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

// Emite un Documento Soporte de Pago de Nómina Electrónica (DSPNE).
// Nota de ajuste de nómina de REEMPLAZO (corrige con datos nuevos).
export async function replaceFiscalPayroll(id, dto) {
  return apiFetch(`/fiscal/payroll/${id}/replace`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

// Nota de ajuste de nómina de ELIMINACIÓN (borra una mal enviada).
export async function eliminateFiscalPayroll(id, reason) {
  return apiFetch(`/fiscal/payroll/${id}/eliminate`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function emitFiscalPayroll(dto) {
  return apiFetch('/fiscal/payroll', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

// Devuelve el HTML de la representación gráfica (para mostrar en un iframe).
// apiFetch devuelve el texto crudo cuando la respuesta no es JSON.
export async function getFiscalRepresentation(id) {
  return apiFetch(`/fiscal/documents/${id}/representation`);
}

// Envía la factura al correo del cliente.
export async function sendFiscalEmail(id) {
  return apiFetch(`/fiscal/documents/${id}/send-email`, { method: 'POST' });
}

// Devuelve el enlace de WhatsApp para compartir la factura con el cliente.
export async function getFiscalWhatsapp(id) {
  return apiFetch(`/fiscal/documents/${id}/whatsapp`);
}

// Elimina un documento (solo si aún no fue transmitido a la DIAN).
export async function deleteFiscalDocument(id) {
  return apiFetch(`/fiscal/documents/${id}`, { method: 'DELETE' });
}

// Anula una factura generando su nota crédito total.
export async function annulFiscalDocument(id, reason) {
  return apiFetch(`/fiscal/documents/${id}/annul`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

// Crea una nota crédito (parcial) sobre una factura. dto.reasonCode = 1..5
export async function createFiscalCreditNote(dto) {
  return apiFetch('/fiscal/credit-notes', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

// Crea una nota débito (subir valor) sobre una factura. dto.reasonCode = 1..4
export async function createFiscalDebitNote(dto) {
  return apiFetch('/fiscal/debit-notes', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}
