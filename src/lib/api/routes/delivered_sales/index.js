import apiFetch from '../../auth/client';
import { toFullISO } from '../../utils/utils';

export async function getDeliveredSales() {
  return apiFetch('/customers');
}

export async function getDeliveredSaleById(id) {
  return apiFetch(`/customers/${id}`);
}

export async function updateDeliveredSale(id, dto) {
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

export async function deleteDeliveredSale(id) {
  return apiFetch(`/customers/${id}`, { method: 'DELETE' });
}

export async function exportDeliveredSales() {
  const blob = await apiFetch('/customers/delivered/export', {
    method: 'GET',
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ventas_realizadas_${Date.now()}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
