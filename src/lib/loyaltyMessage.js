// Mensaje de WhatsApp adaptado a la SITUACIÓN del cliente. Un solo punto que
// elige entre: reactivar (con regalo), frecuente en fidelización, cliente
// antiguo (graduado) o saludo nuevo. Se usa en todos los módulos con contacto
// al cliente; funciona con los datos que traiga `customer` (loyalty, segment,
// días sin volver), con buenos fallbacks.
import { buildWinbackMessage } from './appointmentConfirm';

function firstName(name) {
  const first = String(name || '').trim().split(/\s+/)[0] || '';
  return first ? first[0].toUpperCase() + first.slice(1).toLowerCase() : '';
}

export function customerWhatsappMessage(customer, companyName) {
  const first = firstName(customer?.name);
  const hola = first ? `¡Hola ${first}!` : '¡Hola!';
  const salon = companyName || 'nuestro salón';
  const L = customer?.loyalty;
  const seg = customer?.segment;

  // 1) POR REACTIVAR: racha de fidelización vencida, segmento en riesgo/perdido,
  // o hace mucho que no vuelve. (No aplica a quien acaba de venir.)
  const dias =
    customer?.daysSinceLastVisit ?? customer?.days ?? L?.daysSinceLastVisit;
  const needsWinback =
    !!L?.expired ||
    ['EN_RIESGO', 'PERDIDO'].includes(seg) ||
    (typeof dias === 'number' && dias >= 30);

  if (needsWinback) {
    return buildWinbackMessage(customer, companyName);
  }

  // 3) CLIENTE ANTIGUO (graduado): normal, agradece y agenda su próxima cita.
  if (L?.completed) {
    return `${hola} 🙌 Gracias por tu fidelidad, ya eres cliente de casa. ¿Cuándo te gustaría tu próxima cita en ${salon}? Con gusto te agendamos.`;
  }

  // 2) FIDELIZACIÓN ACTIVA: muestra CÓMO está configurada (en qué corte y cuánto
  // descuento, según los ajustes), el avance del cliente, el descuento que le
  // espera si aplica, y el reinicio a los N días. Todo dinámico.
  if (L?.enabled) {
    const cuts = L.currentCount || 0;
    const maxDays = L.maxDays || 30;

    // Escalones configurados (solo los que tienen descuento > 0).
    const tiers = [L.tier1, L.tier2].filter(
      (t) => t && t.percent > 0 && t.visits > 0
    );
    const tierText = tiers
      .map((t) => `en el corte #${t.visits} tienes ${t.percent}% de descuento`)
      .join(' y ');

    const intro =
      cuts > 0
        ? `Llevas ${cuts} corte${cuts === 1 ? '' : 's'} acumulado${cuts === 1 ? '' : 's'} en tu fidelización de ${salon}.`
        : `En ${salon} premiamos tu fidelidad.`;

    const programa = tierText
      ? ` ${cuts > 0 ? 'Recuerda:' : 'Funciona así:'} ${tierText}.`
      : '';

    const premio =
      L.nextDiscount > 0
        ? ` 🎁 ¡En tu próxima visita (corte #${L.nextVisit}) tienes ${L.nextDiscount}% de descuento!`
        : '';

    return `${hola} ${intro}${programa}${premio} Ten en cuenta que si pasan más de ${maxDays} días entre visitas, tu fidelización se reinicia. ¿Agendamos tu próxima cita? 💈`;
  }

  // 5) NORMAL / SIN FIDELIZACIÓN ACTIVA: saludo simple invitando a agendar.
  return `${hola} Te escribimos de ${salon}. ¿Te gustaría agendar tu próxima cita? ¡Te esperamos! 💈`;
}

// Compatibilidad: nombre anterior.
export const loyaltyWhatsappMessage = customerWhatsappMessage;
