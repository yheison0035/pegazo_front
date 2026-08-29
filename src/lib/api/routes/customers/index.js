import apiFetch from '../../auth/client';

export async function getCustomers(params = {}) {
  const { page = 1, limit = 10, ...filters } = params;

  const query = new URLSearchParams();

  query.set('page', String(page));
  query.set('limit', String(limit));

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      query.set(key, String(value));
    }
  });

  return apiFetch(`/customers?${query.toString()}`);
}

// Autocompletar: trae el cliente si el documento ya existe (o null)
export async function lookupCustomerByDocument(document) {
  return apiFetch(
    `/customers/lookup?document=${encodeURIComponent(document || '')}`
  );
}

export async function getCustomerById(id) {
  return apiFetch(`/customers/${id}`);
}

// Ficha 360°: métricas, historial de ventas/citas y segmento.
export async function getCustomerSummary(id) {
  return apiFetch(`/customers/${id}/summary`);
}

// Canjea un premio de fidelización del cliente.
export async function redeemCustomerReward(id) {
  return apiFetch(`/customers/${id}/redeem-reward`, { method: 'PATCH' });
}

// Gradúa (o desgradúa) la tarjeta de fidelización del cliente a mano.
export async function setLoyaltyComplete(id, complete = true) {
  return apiFetch(`/customers/${id}/loyalty-complete`, {
    method: 'PATCH',
    body: JSON.stringify({ complete }),
  });
}

// Clientes con actividad de fidelización (sellos/premios) + config de la empresa.
export async function getLoyaltyCustomers(params = {}) {
  const { page = 1, limit = 20, ...filters } = params;
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('limit', String(limit));
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) query.set(k, String(v));
  });
  return apiFetch(`/customers/loyalty?${query.toString()}`);
}

export async function createCustomer(dto) {
  const body = {
    ...dto,
    localId: Number(dto.localId),
    // Fecha vacía => se omite (evita fallar @IsDateString con '').
    birthday: dto.birthday || undefined,
  };
  return apiFetch('/customers', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateCustomer(id, dto) {
  const {
    id: _id,
    createdAt,
    updatedAt,
    local,
    companyId,
    lastWinbackAt,
    ...cleanDto
  } = dto;

  const body = {
    ...cleanDto,
    localId: Number(cleanDto.localId) || null,
    // Fecha vacía => null (limpia el cumpleaños).
    birthday: cleanDto.birthday || null,
  };

  return apiFetch(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteCustomer(id) {
  return apiFetch(`/customers/${id}`, { method: 'DELETE' });
}
