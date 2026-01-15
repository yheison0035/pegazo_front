import apiFetch from '../../auth/client';
import { toLocalDateTimeISO } from '../../utils/utils';

export async function getDeliveredSales() {
  return apiFetch('/sales');
}

export async function getDeliveredSaleById(id) {
  return apiFetch(`/sales/${id}`);
}

export async function updateDeliveredSale(id, dto) {
  debugger;
  const {
    id: _id,
    createdAt,
    updatedAt,
    code,
    totalAmount,
    customer,
    user,
    local,
    ...cleanDto
  } = dto;

  const body = {
    ...cleanDto,
    saleDate: dto.saleDate ? toLocalDateTimeISO(dto.saleDate) : undefined,
    customerId: Number(cleanDto.customerId) || null,
    userId: Number(cleanDto.userId) || null,
    localId: Number(cleanDto.localId) || null,
  };

  return apiFetch(`/sales/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteDeliveredSale(id) {
  return apiFetch(`/sales/${id}`, { method: 'DELETE' });
}
