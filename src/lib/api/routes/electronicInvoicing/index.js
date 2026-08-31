import apiFetch from '../../auth/client';

export async function getFactusConfig() {
  return apiFetch('/electronic-invoicing/config');
}

export async function saveFactusConfig(dto) {
  return apiFetch('/electronic-invoicing/config', {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

export async function testFactusConnection() {
  return apiFetch('/electronic-invoicing/test', { method: 'POST' });
}

export async function getFactusNumberingRanges() {
  return apiFetch('/electronic-invoicing/numbering-ranges');
}

export async function emitElectronicInvoice(saleId) {
  return apiFetch(`/electronic-invoicing/emit/${saleId}`, { method: 'POST' });
}

export async function getElectronicInvoice(saleId) {
  return apiFetch(`/electronic-invoicing/sale/${saleId}`);
}
