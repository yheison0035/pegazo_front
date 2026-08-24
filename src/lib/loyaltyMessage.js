// Mensaje de WhatsApp adaptado a la SITUACIÓN del cliente. Un solo punto que
// elige entre: reactivar (con regalo), fidelización activa (dinámica según los
// ajustes), cliente antiguo (graduado) o saludo normal. Cada mensaje se firma
// con "Soy {tu nombre} de {empresa}", tomados de la sesión (o de lo que se pase).
import { buildWinbackMessage } from './appointmentConfirm';

function firstName(name) {
  const first = String(name || '').trim().split(/\s+/)[0] || '';
  return first ? first[0].toUpperCase() + first.slice(1).toLowerCase() : '';
}

// Usuario logueado (para firmar el mensaje) desde localStorage — sin depender de
// props, así funciona también en las celdas de las tablas.
function sessionUser() {
  try {
    if (typeof window === 'undefined') return null;
    return JSON.parse(localStorage.getItem('usuario') || 'null');
  } catch {
    return null;
  }
}

export function customerWhatsappMessage(customer, companyName, senderName) {
  const me = sessionUser();
  const salon = companyName || me?.company?.name || 'nuestro salón';
  const sender = firstName(senderName || me?.name);
  const cli = firstName(customer?.name);
  const hola = cli ? `¡Hola ${cli}!` : '¡Hola!';
  // Firma: "Soy {nombre} de {empresa}." (si no hay nombre, saludo del negocio).
  const soy = sender ? `Soy ${sender} de ${salon}.` : `Te escribimos de ${salon}.`;
  const intro = `${hola} ${soy}`;

  const L = customer?.loyalty;
  const seg = customer?.segment;

  // 1) POR REACTIVAR: racha vencida, segmento en riesgo/perdido, o hace mucho
  // que no vuelve. (buildWinbackMessage ya incluye la firma y el regalo.)
  const dias =
    customer?.daysSinceLastVisit ?? customer?.days ?? L?.daysSinceLastVisit;
  const needsWinback =
    !!L?.expired ||
    ['EN_RIESGO', 'PERDIDO'].includes(seg) ||
    (typeof dias === 'number' && dias >= 30);
  if (needsWinback) {
    return buildWinbackMessage(customer, salon, sender);
  }

  // 3) CLIENTE ANTIGUO (graduado): normal, agradece y agenda su próxima cita.
  if (L?.completed) {
    return `${intro} 🙌 Gracias por tu fidelidad, ya eres cliente de casa. ¿Cuándo te gustaría tu próxima cita? Con gusto te agendamos.`;
  }

  // 2) FIDELIZACIÓN ACTIVA: muestra CÓMO está configurada (en qué corte y cuánto,
  // según los ajustes), el avance del cliente, el premio que le espera y el
  // reinicio a los N días. Todo dinámico.
  if (L?.enabled) {
    const cuts = L.currentCount || 0;
    const maxDays = L.maxDays || 30;

    const tiers = [L.tier1, L.tier2].filter(
      (t) => t && t.percent > 0 && t.visits > 0
    );
    const tierText = tiers
      .map((t) => `en el corte #${t.visits} tienes ${t.percent}% de descuento`)
      .join(' y ');

    const avance =
      cuts > 0
        ? ` Llevas ${cuts} corte${cuts === 1 ? '' : 's'} acumulado${cuts === 1 ? '' : 's'} en tu fidelización.`
        : ' Te contamos de nuestra fidelización.';
    const programa = tierText
      ? ` ${cuts > 0 ? 'Recuerda:' : 'Funciona así:'} ${tierText}.`
      : '';
    const premio =
      L.nextDiscount > 0
        ? ` 🎁 ¡En tu próxima visita (corte #${L.nextVisit}) tienes ${L.nextDiscount}% de descuento!`
        : '';

    return `${intro}${avance}${programa}${premio} Ten en cuenta que si pasan más de ${maxDays} días entre visitas, tu fidelización se reinicia. ¿Agendamos tu próxima cita? 💈`;
  }

  // 5) NORMAL / SIN FIDELIZACIÓN ACTIVA: saludo simple invitando a agendar.
  return `${intro} ¿Te gustaría agendar tu próxima cita? ¡Te esperamos! 💈`;
}

// Compatibilidad: nombre anterior.
export const loyaltyWhatsappMessage = customerWhatsappMessage;
