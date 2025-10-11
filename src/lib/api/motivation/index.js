import apiFetch from '../auth/client';

export async function getMotivationMessage() {
  return apiFetch('/motivation');
}

export async function createMotivation(dto) {
  return apiFetch('/motivation', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateMotivation(id, dto) {
  const { id: _id, createdAt, updatedAt, ...cleanDto } = dto;

  const body = {
    ...cleanDto,
  };

  return apiFetch(`/motivation/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteMotivation(id) {
  return apiFetch(`/motivation/${id}`, { method: 'DELETE' });
}
