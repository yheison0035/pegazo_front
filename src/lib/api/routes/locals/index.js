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
    managerId: Number(dto.managerId),
  };
  return apiFetch('/locals', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateLocal(id, dto) {
  const {
    id: _id,
    createdAt,
    updatedAt,
    manager,
    userId,
    users,
    ...cleanDto
  } = dto;

  const body = {
    ...cleanDto,
    managerId: Number(cleanDto.managerId) || null,
  };

  return apiFetch(`/locals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteLocal(id) {
  return apiFetch(`/locals/${id}`, { method: 'DELETE' });
}
