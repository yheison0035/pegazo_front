import apiFetch from '../../auth/client';
import { notifySalesChanged } from '../sales';

export async function getVerifyCodeSale(code) {
  return apiFetch(`sales/verify/${code}`);
}

export async function getDailySalesReport(date, localId) {
  return apiFetch('/sales/reports/daily', {
    method: 'POST',
    body: JSON.stringify({
      date,
      localId: Number(localId),
    }),
  });
}

export async function getSalesRangeReport(dto) {
  const body = {
    startDate: dto.startDate?.split('T')[0],
    endDate: dto.endDate?.split('T')[0],
    localId: Number(dto.localId),
    userId: Number(dto.userId),
  };

  return apiFetch('/sales/reports/range', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getSalesRangeGeneralReport(dto) {
  return apiFetch('/sales/reports/range/general', {
    method: 'POST',
    body: JSON.stringify({
      startDate: dto.startDate,
      endDate: dto.endDate,
      localId: Number(dto.localId),
    }),
  });
}

export async function getServicePerformanceReport(dto) {
  return apiFetch('/sales/reports/service-performance', {
    method: 'POST',
    body: JSON.stringify({
      startDate: dto.startDate,
      endDate: dto.endDate,
      localId: Number(dto.localId),
    }),
  });
}

export async function getDeliveredSales(params = {}) {
  const { page = 1, limit = 10, ...filters } = params;

  const query = new URLSearchParams();

  query.set('page', String(page));
  query.set('limit', String(limit));

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      query.set(key, String(value));
    }
  });

  return apiFetch(`/sales?${query.toString()}`);
}

export async function getDeliveredSaleById(id) {
  return apiFetch(`/sales/${id}`);
}

// Clientes por reactivar: última visita hace minDays días o más (def. 20).
export async function getInactiveCustomers({ minDays = 20 } = {}) {
  const query = new URLSearchParams({ minDays: String(minDays) });
  return apiFetch(`/sales/inactive-customers?${query.toString()}`);
}

// Marca que ya se le escribió al cliente (pasa a la sección "Escritos").
export async function markWinbackContacted(customerId) {
  return apiFetch(`/sales/inactive-customers/${customerId}/contacted`, {
    method: 'PATCH',
  });
}

export async function updateDeliveredSale(id, dto) {
  const {
    id: _id,
    createdAt,
    updatedAt,
    code,
    totalAmount,
    customer,
    user,
    local,
    ecommerceCustomerId,
    source,
    shippingStatus,
    wompiTransactionId,
    wompiReference,
    wompiStatus,
    wompiPayload,
    appointmentId,
    shipment,
    appointment,
    ...cleanDto
  } = dto;

  // Los servicios deben viajar como serviceId (no inventoryVariantId); si no,
  // el backend los busca como producto y responde "Producto inválido".
  const items = (cleanDto.items || []).map((p) => {
    const quantity = Number(p.quantity);
    const discount = Number(p.discount) || 0;
    const isService =
      p.type === 'service' || (p.serviceId != null && !p.inventoryVariantId);

    return isService
      ? { serviceId: p.serviceId ?? p.inventoryVariantId, quantity, discount }
      : { inventoryVariantId: p.inventoryVariantId, quantity, discount };
  });

  const body = {
    ...cleanDto,
    items,
    saleDate: dto.saleDate,
    customerId: Number(cleanDto.customerId) || null,
    userId: Number(cleanDto.userId) || null,
    localId: Number(cleanDto.localId) || null,
  };

  const res = await apiFetch(`/sales/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  notifySalesChanged();
  return res;
}

export async function deleteDeliveredSale(id) {
  const res = await apiFetch(`/sales/${id}`, { method: 'DELETE' });
  notifySalesChanged();
  return res;
}
