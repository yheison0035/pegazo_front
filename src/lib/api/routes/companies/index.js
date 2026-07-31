import apiFetch from '../../auth/client';

export async function getCompanies(params = {}) {
  const { page = 1, limit = 10, ...filters } = params;

  const query = new URLSearchParams();

  query.set('page', String(page));
  query.set('limit', String(limit));

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      query.set(key, String(value));
    }
  });

  return apiFetch(`/companies?${query.toString()}`);
}

export async function getCompanyById(id) {
  return apiFetch(`/companies/${id}`);
}

export async function createCompany(dto) {
  return apiFetch('/companies', { method: 'POST', body: JSON.stringify(dto) });
}

export async function updateCompany(id, dto) {
  const { id: _id, createdAt, updatedAt, users, ...cleanDto } = dto;

  return apiFetch(`/companies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(cleanDto),
  });
}

export async function deleteCompany(id) {
  return apiFetch(`/companies/${id}`, { method: 'DELETE' });
}

// Resumen global de la plataforma
export async function getPlatformOverview() {
  return apiFetch('/companies/platform/overview');
}

// Activar / desactivar empresa (suspensión por impago)
export async function setCompanyStatus(id, status) {
  return apiFetch(`/companies/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
