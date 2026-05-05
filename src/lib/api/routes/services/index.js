import apiFetch from '../../auth/client';

export async function getServices(params = {}) {
  const { page = 1, limit = 10, all = false, ...filters } = params;

  const query = new URLSearchParams();

  if (!all) {
    query.set('page', String(page));
    query.set('limit', String(limit));
  }

  if (all) {
    query.set('all', 'true');
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      query.set(key, String(value));
    }
  });

  return apiFetch(`/services?${query.toString()}`);
}

export async function getServiceById(id) {
  return apiFetch(`/services/${id}`);
}

export async function createService(dto) {
  return apiFetch('/services', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateService(id, dto) {
  const {
    id: _id,
    createdAt,
    updatedAt,
    companyId,
    serviceLocals,
    barbers,
    ...cleanDto
  } = dto;

  return apiFetch(`/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(cleanDto),
  });
}

export async function deleteService(id) {
  return apiFetch(`/services/${id}`, {
    method: 'DELETE',
  });
}

export async function getPublicServices(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      query.set(key, String(value));
    }
  });

  return apiFetch(`/public/services?${query.toString()}`);
}
