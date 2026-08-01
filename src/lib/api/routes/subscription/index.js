import apiFetch from '../../auth/client';

// Inicia la compra/mejora del plan. Cuando activemos pagos, el backend
// devolverá { data: { checkoutUrl } } de Wompi para redirigir al pago.
export async function startPlanCheckout(plan) {
  return apiFetch('/subscription/checkout', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  });
}
