import apiFetch from '../../auth/client';

export async function getLocals() {
  return apiFetch('/locals');
}

export async function getLocalById(id) {
  return apiFetch(`/locals/${id}`);
}

export async function createLocal(dto) {
  const body = {
    ...dto,
    userId: Number(dto.userId),
  };
  return apiFetch('/locals', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateLocal(id, dto) {
  const { id: _id, createdAt, updatedAt, user, ...cleanDto } = dto;

  const body = {
    ...cleanDto,
    userId: Number(cleanDto.userId) || null,
  };

  return apiFetch(`/locals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteLocal(id) {
  return apiFetch(`/locals/${id}`, { method: 'DELETE' });
}
