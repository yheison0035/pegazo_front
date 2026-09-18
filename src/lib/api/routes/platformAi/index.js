import apiFetch from '../../auth/client';

// Config de IA de la plataforma (solo SUPER_PLATFORM_ADMIN).
export async function getPlatformAiSettings() {
  return apiFetch('/platform-ai/settings');
}

export async function updatePlatformAiSettings(dto) {
  return apiFetch('/platform-ai/settings', {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

// ¿La IA está lista para usarse? (para mostrar/ocultar el botón en inventario).
export async function getPlatformAiStatus() {
  return apiFetch('/platform-ai/status');
}

// Genera descripción/características/especificaciones a partir del nombre.
export async function generateProductContent(dto) {
  return apiFetch('/platform-ai/generate/product', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}
