import apiFetch from '../../auth/client';

// Gastos fijos / recurrentes (arriendo, servicios, internet…).

export async function getFixedExpenses() {
  return apiFetch('/fixed-expenses');
}

export async function createFixedExpense(dto) {
  return apiFetch('/fixed-expenses', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateFixedExpense(id, dto) {
  return apiFetch(`/fixed-expenses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export async function deleteFixedExpense(id) {
  return apiFetch(`/fixed-expenses/${id}`, { method: 'DELETE' });
}

// Marca el gasto fijo como pagado: crea el gasto real con fecha y observación.
export async function payFixedExpense(id, dto) {
  return apiFetch(`/fixed-expenses/${id}/pay`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

// Deshace el pago del mes actual.
export async function unpayFixedExpense(id) {
  return apiFetch(`/fixed-expenses/${id}/unpay`, { method: 'POST' });
}
