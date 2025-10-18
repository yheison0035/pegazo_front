import apiFetch from '../../auth/client';
import { toFullISO } from '../../utils/utils';

export async function createSale(dto) {
  const body = {
    ...dto,
    birthdate: dto.birthdate ? toFullISO(dto.birthdate) : undefined,
    advisorId: Number(dto.advisorId),
    stateId: Number(dto.stateId),
  };
  return apiFetch('/customers', { method: 'POST', body: JSON.stringify(body) });
}

export async function getDeliveredProducts() {
  return apiFetch('/customers/delivered');
}
