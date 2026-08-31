import apiFetch from '../../auth/client';

export async function getUnitsOfMeasure() {
  return apiFetch('/units-of-measure');
}

export async function createUnitOfMeasure(dto) {
  return apiFetch('/units-of-measure', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateUnitOfMeasure(id, dto) {
  return apiFetch(`/units-of-measure/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

export async function deleteUnitOfMeasure(id) {
  return apiFetch(`/units-of-measure/${id}`, { method: 'DELETE' });
}
