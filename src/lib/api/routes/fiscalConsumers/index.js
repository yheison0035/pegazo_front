import apiFetch from '../../auth/client';

// Consumidores de la API fiscal (plataformas externas que facturan vía nuestra
// API de factura/nómina electrónica). Solo SUPER_PLATFORM_ADMIN.
export const getFiscalConsumers = () => apiFetch('/fiscal-consumers');

export const createFiscalConsumer = (name) =>
  apiFetch('/fiscal-consumers', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });

export const toggleFiscalConsumer = (id, active) =>
  apiFetch(`/fiscal-consumers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  });

export const getFiscalConsumerKeys = (id) =>
  apiFetch(`/fiscal-consumers/${id}/keys`);

export const createFiscalConsumerKey = (id, label) =>
  apiFetch(`/fiscal-consumers/${id}/keys`, {
    method: 'POST',
    body: JSON.stringify({ label }),
  });

export const revokeFiscalConsumerKey = (keyId) =>
  apiFetch(`/fiscal-consumers/keys/${keyId}/revoke`, { method: 'PATCH' });
