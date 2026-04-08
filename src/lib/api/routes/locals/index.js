import apiFetch from '../../auth/client';

export async function getLocals(params = {}) {
  const { page = 1, limit = 10, ...filters } = params;

  const query = new URLSearchParams();

  query.set('page', String(page));
  query.set('limit', String(limit));

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      query.set(key, String(value));
    }
  });

  return apiFetch(`/locals?${query.toString()}`);
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
    companyId,
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
