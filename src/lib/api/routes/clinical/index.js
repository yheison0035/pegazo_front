import apiFetch from '../../auth/client';

// Historia clínica de un paciente.
export async function getClinical(customerId) {
  return apiFetch(`/clinical/${customerId}`);
}

export async function saveClinicalRecord(customerId, dto) {
  return apiFetch(`/clinical/${customerId}/record`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

export async function addClinicalEntry(customerId, dto) {
  return apiFetch(`/clinical/${customerId}/entry`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function deleteClinicalEntry(id) {
  return apiFetch(`/clinical/entry/${id}`, { method: 'DELETE' });
}
