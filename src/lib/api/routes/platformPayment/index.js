import apiFetch from '../../auth/client';

// Cuentas de pago de la plataforma (lectura para cualquier usuario autenticado).
export async function getPlatformPaymentSettings() {
  return apiFetch('/platform-payment/settings');
}

// Solo SUPER_PLATFORM_ADMIN.
export async function updatePlatformPaymentSettings(dto) {
  return apiFetch('/platform-payment/settings', {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}
