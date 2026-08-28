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

// Config fiscal mínima para el POS (accesible a cualquier vendedor).
export async function getFiscalConfig() {
  return apiFetch('/company/fiscal-config');
}

// Configuración fiscal (IVA / datos para facturar).
export async function updateFiscal(dto) {
  return apiFetch('/company/fiscal', {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

// Overrides de vocabulario propios de la empresa (terminología).
export async function updateTerminology(dto) {
  return apiFetch('/company/terminology', {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

// Política de caja: exigir abrir el día (caja) para poder vender.
export async function updateCashPolicy(requireCashOpen) {
  return apiFetch('/company/cash-policy', {
    method: 'PATCH',
    body: JSON.stringify({ requireCashOpen }),
  });
}

// Tema de diseño del panel/CRM (orange | blue | emerald).
export async function updateCompanyMail(dto) {
  return apiFetch('/company/mail', {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export async function testCompanyMail(to) {
  return apiFetch('/company/mail/test', {
    method: 'POST',
    body: JSON.stringify({ to }),
  });
}

export async function updateCrmTheme(theme) {
  return apiFetch('/company/theme', {
    method: 'PATCH',
    body: JSON.stringify({ theme }),
  });
}
