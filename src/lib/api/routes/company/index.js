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
