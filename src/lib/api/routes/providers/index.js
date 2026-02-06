import apiFetch from '../../auth/client';

export async function getProviders(params = {}) {
  const { page = 1, limit = 10, ...filters } = params;

  const query = new URLSearchParams();

  query.set('page', String(page));
  query.set('limit', String(limit));

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      query.set(key, String(value));
    }
  });

  return apiFetch(`/providers?${query.toString()}`);
}

export async function getProviderById(id) {
  return apiFetch(`/providers/${id}`);
}

export async function createProvider(dto) {
  return apiFetch('/providers', { method: 'POST', body: JSON.stringify(dto) });
}

export async function updateProvider(id, dto) {
  const { id: _id, createdAt, updatedAt, ...cleanDto } = dto;

  const body = {
    ...cleanDto,
  };

  return apiFetch(`/providers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteProvider(id) {
  return apiFetch(`/providers/${id}`, { method: 'DELETE' });
}
