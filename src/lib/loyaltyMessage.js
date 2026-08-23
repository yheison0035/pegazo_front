// Texto de WhatsApp adaptado al estado de fidelización del cliente. Se usa donde
// ya tenemos el `loyalty` calculado (módulo de Fidelización, detalle de cliente).
// `customer.loyalty` es el objeto que devuelve el backend (loyaltyStatus).
export function loyaltyWhatsappMessage(customer, businessName) {
  const first = (customer?.name || '').trim().split(/\s+/)[0] || '';
  const hola = first ? `¡Hola ${first}!` : '¡Hola!';
  const firma = businessName ? ` — ${businessName}` : '';
  const L = customer?.loyalty;

  // Sin fidelización activa: saludo simple.
  if (!L || !L.enabled) {
    return `${hola} Te escribimos para invitarte a tu próxima visita. ¡Te esperamos!${firma}`;
  }

  // Cliente antiguo (graduado): agradecer la fidelidad.
  if (L.completed) {
    return `${hola} 🙌 Gracias por tu fidelidad, ya eres cliente de casa. Queremos seguir consintiéndote: pronto tendremos algo especial para ti. ¡Te esperamos!${firma}`;
  }

  // Recompensa disponible en la próxima visita.
  if (L.nextDiscount > 0) {
    return `${hola} 🎁 En tu próxima visita tienes ${L.nextDiscount}% de descuento por fidelización. ¡Te esperamos!${firma}`;
  }

  // En camino a la recompensa: cuántas visitas faltan.
  const count = L.currentCount || 0;
  const t1 = L.tier1?.visits || 0;
  const t2 = L.tier2?.visits || 0;
  if (t1 && count < t1) {
    const faltan = t1 - count;
    return `${hola} Llevas ${count} visita(s); te falta${faltan > 1 ? 'n' : ''} ${faltan} para tu ${L.tier1.percent}% de descuento por fidelización. ¡Te esperamos!${firma}`;
  }
  if (t2 && count < t2) {
    const faltan = t2 - count;
    return `${hola} ¡Vas muy bien! Te falta${faltan > 1 ? 'n' : ''} ${faltan} visita(s) para tu ${L.tier2.percent}% de descuento. ¡Te esperamos!${firma}`;
  }

  return `${hola} ¡Te esperamos para tu próxima visita!${firma}`;
}
