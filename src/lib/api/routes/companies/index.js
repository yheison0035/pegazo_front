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
  'billingMode',
  'paidUntil',
  'startDate',
  'monthlyPrice',
  'paymentDay',
  'domain',
  'websiteEnabled',
  // Funciones/flags que activa la plataforma por empresa.
  'electronicInvoicingEnabled',
  'isTestCompany',
  'bankNotifyEnabled',
  'enabledModules',
  'discountedPrice',
  'discountUntil',
];

// Campos booleanos que el formulario puede mandar como texto ('true'/'false').
const BOOLEAN_FIELDS = [
  'websiteEnabled',
  'electronicInvoicingEnabled',
  'isTestCompany',
  'bankNotifyEnabled',
];

const ADMIN_FIELDS = ['adminName', 'adminEmail', 'adminPassword'];

function buildPayload(dto, fields) {
  const payload = {};

  fields.forEach((field) => {
    const value = dto[field];

    // Los módulos manuales sí se envían vacíos ([]): significa "volver a
    // automático". El resto se omite cuando no trae valor.
    if (field === 'enabledModules') {
      if (Array.isArray(value)) payload[field] = value;
      return;
    }

    if (value === undefined || value === null || value === '') return;

    // Los flags booleanos del formulario llegan como texto ('true'/'false').
    if (BOOLEAN_FIELDS.includes(field)) {
      payload[field] = value === true || value === 'true';
      return;
    }

    // El precio llega con formato COP ("50.000"): se envía como número entero.
    if (field === 'monthlyPrice' || field === 'discountedPrice') {
      const n = Number(String(value).replace(/[^\d]/g, ''));
      if (Number.isFinite(n) && n > 0) payload[field] = n;
      return;
    }

    // El día de pago es un entero (1-31).
    if (field === 'paymentDay') {
      const n = Number(String(value).replace(/[^\d]/g, ''));
      if (Number.isFinite(n) && n >= 1 && n <= 31) payload[field] = n;
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

// Auditoría de accesos de soporte (impersonaciones).
export async function getPlatformAudit(limit = 50) {
  return apiFetch(`/companies/platform/audit?limit=${limit}`);
}

// Actividad reciente de todas las empresas.
export async function getPlatformActivity(limit = 60) {
  return apiFetch(`/companies/platform/activity?limit=${limit}`);
}

// Vista 360° de una empresa.
export async function getCompanyDetail(id) {
  return apiFetch(`/companies/platform/${id}/detail`);
}

// Renovar/marcar pagado (+N días, default 30).
// Registrar pago / renovar. Preferir `months` (anclado al día de cobro, apto
// para pago adelantado). Si se pasan `days`, va por días (legado).
export async function renewCompany(id, payload = {}) {
  const { months, days, ...rest } = payload;
  // `rest` lleva los datos del pago (unitPrice, discountType, discountValue,
  // amount, method, note, paidAt) para dejar historial.
  const body =
    months != null ? { months, ...rest } : { days: days ?? 30, ...rest };
  return apiFetch(`/companies/platform/${id}/renew`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

// Historial de pagos de suscripción de una empresa (solo plataforma).
export async function getCompanyPayments(id) {
  return apiFetch(`/companies/platform/${id}/payments`);
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
