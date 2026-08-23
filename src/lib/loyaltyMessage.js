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

  // 2) FRECUENTE EN FIDELIZACIÓN: cortes acumulados + reinicio a los N días +
  // (si aplica) el descuento que le espera, e invita a agendar.
  if (L?.enabled && (L.currentCount || 0) > 0) {
    const cuts = L.currentCount;
    const maxDays = L.maxDays || 30;
    const premio =
      L.nextDiscount > 0
        ? ` 🎁 En tu próxima visita tienes ${L.nextDiscount}% de descuento por fidelización.`
        : '';
    return `${hola} Llevas ${cuts} corte${cuts === 1 ? '' : 's'} en tu fidelización.${premio} Recuerda que si pasan más de ${maxDays} días entre visitas, tu fidelización se reinicia. ¿Agendamos tu próxima cita en ${salon}? 💈`;
  }

  // 5) NUEVO / SIN DATOS: saludo simple invitando a agendar.
  return `${hola} Te escribimos de ${salon}. ¿Te gustaría agendar tu próxima cita? ¡Te esperamos! 💈`;
}

// Compatibilidad: nombre anterior.
export const loyaltyWhatsappMessage = customerWhatsappMessage;
