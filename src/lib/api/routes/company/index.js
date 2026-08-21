import apiFetch from '../../auth/client';

// Configuración self-service de la empresa (dueño/admin).
export async function getCompanySettings() {
  return apiFetch('/company/settings');
}

// Actualiza la configuración de fidelización (tarjeta de sellos).
export async function updateLoyalty(dto) {
  return apiFetch('/company/loyalty', {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

// Datos básicos de la empresa (nombre, logo, contacto).
export async function updateCompanyProfile(dto) {
  return apiFetch('/company/profile', {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

// Horario de atención.
export async function updateCompanyHours(dto) {
  return apiFetch('/company/hours', {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

// Recalcula la fidelización de todos los clientes a partir del historial de
// ventas (backfill). Re-ejecutable.
export async function syncLoyaltyFromSales() {
  return apiFetch('/company/loyalty/sync', { method: 'POST' });
}

// Política de caja: exigir abrir el día (caja) para poder vender.
export async function updateCashPolicy(requireCashOpen) {
  return apiFetch('/company/cash-policy', {
    method: 'PATCH',
    body: JSON.stringify({ requireCashOpen }),
  });
}

// Tema de diseño del panel/CRM (orange | blue | emerald).
export async function updateCrmTheme(theme) {
  return apiFetch('/company/theme', {
    method: 'PATCH',
    body: JSON.stringify({ theme }),
  });
}
