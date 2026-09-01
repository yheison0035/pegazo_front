import apiFetch from '../../auth/client';

// Inicia el pago del plan con Wompi. El backend devuelve { data: { checkoutUrl } }
// ya firmado para redirigir al checkout de Wompi.
export async function startPlanCheckout(plan) {
  return apiFetch('/subscription/checkout', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  });
}

// Estado de un pago tras volver del checkout (?ref=...).
export async function getPlanPaymentStatus(ref) {
  return apiFetch(`/subscription/status?ref=${encodeURIComponent(ref)}`);
}
