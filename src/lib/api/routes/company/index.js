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
