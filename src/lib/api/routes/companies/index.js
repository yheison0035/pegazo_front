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

// Sube el logo de la empresa a Cloudinary (carpeta companies/logos) y devuelve
// su URL. Sirve tanto autenticado (panel) como público (registro).
export async function uploadCompanyLogo(file) {
  const fd = new FormData();
  fd.append('file', file);
  return apiFetch('/companies/logo-upload', { method: 'POST', body: fd });
}

// Campos que el backend acepta. Se manda solo esto: la empresa que llega del
// API trae todas sus columnas (theme, favicon, slug…) y el DTO rechaza
// cualquier campo que no conozca, así que enviar el objeto entero fallaba.
const EDITABLE_FIELDS = [
  'name',
  'logo',
  'phone',
  'manager',
  'type',
  'status',
  'plan',
  'paidUntil',
  'startDate',
  'domain',
  'websiteEnabled',
];

const ADMIN_FIELDS = ['adminName', 'adminEmail', 'adminPassword'];

function buildPayload(dto, fields) {
  const payload = {};

  fields.forEach((field) => {
    const value = dto[field];

    if (value === undefined || value === null || value === '') return;

    // El formulario maneja la publicación como texto ('true' / 'false').
    if (field === 'websiteEnabled') {
      payload[field] = value === true || value === 'true';
      return;
    }

    payload[field] = value;
  });

  return payload;
}

export async function createCompany(dto) {
  return apiFetch('/companies', {
    method: 'POST',
    body: JSON.stringify(buildPayload(dto, [...EDITABLE_FIELDS, ...ADMIN_FIELDS])),
  });
}

export async function updateCompany(id, dto) {
  const payload = buildPayload(dto, EDITABLE_FIELDS);

  // El dominio sí debe poder borrarse: se manda vacío a propósito.
  if (dto.domain === '' || dto.domain === null) {
    payload.domain = '';
  }

  // Y la publicación puede apagarse explícitamente.
  if (dto.websiteEnabled === false || dto.websiteEnabled === 'false') {
    payload.websiteEnabled = false;
  }

  return apiFetch(`/companies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
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

// Impersonación de soporte: la plataforma entra como el dueño de la empresa.
export async function impersonateCompany(companyId) {
  return apiFetch(`/auth/impersonate/${companyId}`, { method: 'POST' });
}
