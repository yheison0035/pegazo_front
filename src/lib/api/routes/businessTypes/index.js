import apiFetch from '../../auth/client';

// Tipos de negocio (plataforma): etiqueta + set de módulos por tipo.
export async function getBusinessTypes() {
  return apiFetch('/business-types');
}

// Crear un tipo de negocio nuevo (plataforma).
export async function createBusinessType(dto) {
  return apiFetch('/business-types', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateBusinessType(type, dto) {
  return apiFetch(`/business-types/${type}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}
