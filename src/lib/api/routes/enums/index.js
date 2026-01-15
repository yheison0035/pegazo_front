import apiFetch from '../../auth/client';

export async function getRoles() {
  return apiFetch('/enums/roles');
}

export async function getStatus() {
  return apiFetch('/enums/status');
}

export async function getPaymentMethods() {
  return apiFetch('/enums/payment-methods');
}

export async function getPaymentStatus() {
  return apiFetch('/enums/payment-status');
}

export async function getSaleStatus() {
  return apiFetch('/enums/sale-status');
}
