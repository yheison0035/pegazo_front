import apiFetch from '../auth/client';
import { toFullISO } from '../utils/utils';

export async function getCustomers() {
  return apiFetch('/customers');
}

export async function getDeliveredCustomers() {
  return apiFetch('/customers/delivered');
}

export async function getCustomerById(id) {
  return apiFetch(`/customers/${id}`);
}

export async function createCustomer(dto) {
  const body = {
    ...dto,
    birthdate: dto.birthdate ? toFullISO(dto.birthdate) : undefined,
    advisorId: Number(dto.advisorId),
    stateId: Number(dto.stateId),
  };
  return apiFetch('/customers', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateCustomer(id, dto) {
  const {
    id: _id,
    createdAt,
    updatedAt,
    advisor,
    comments,
    state,
    ...cleanDto
  } = dto;

  const body = {
    ...cleanDto,
    stateId: Number(cleanDto.stateId) || null,
    advisorId: Number(cleanDto.advisorId) || null,
    birthdate: cleanDto.birthdate ? toFullISO(cleanDto.birthdate) : undefined,
  };

  return apiFetch(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteCustomer(id) {
  return apiFetch(`/customers/${id}`, { method: 'DELETE' });
}

export async function addComment(customerId, description) {
  return apiFetch(`/customers/${customerId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ description }),
  });
}

export async function assignAdvisor(customerId, advisorId) {
  return apiFetch(`/customers/${customerId}/assign/${advisorId}`, {
    method: 'POST',
  });
}

export async function assignMultipleCustomers({
  customerIds,
  selectedAdvisor,
}) {
  const body = { customerIds, advisorId: Number(selectedAdvisor) };
  return apiFetch('/customers/assign-multiple', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function importCustomers(file) {
  const fd = new FormData();
  fd.append('file', file);
  return apiFetch('/customers/import', { method: 'POST', body: fd });
}

export async function exportDeliveredCustomers() {
  const blob = await apiFetch('/customers/delivered/export', {
    method: 'GET',
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clientes_entregados_${Date.now()}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
