// Construye el mensaje y el enlace de WhatsApp para confirmar una cita con el
// cliente, con los datos ya escritos (cliente, servicio, día, hora y sede).

// Normaliza el teléfono para wa.me. Si es un móvil colombiano de 10 dígitos que
// empieza por 3, antepone el indicativo 57 para que el enlace abra bien.
export function normalizePhone(phone) {
  let n = String(phone || '').replace(/\D/g, '');
  if (n.length === 10 && n.startsWith('3')) n = `57${n}`;
  return n;
}

function firstName(name) {
  const first = String(name || '').trim().split(/\s+/)[0] || '';
  return first ? first[0].toUpperCase() + first.slice(1).toLowerCase() : '';
}

// Usuario logueado (para firmar el mensaje "Soy {nombre} de {empresa}").
function sessionUser() {
  try {
    if (typeof window === 'undefined') return null;
    return JSON.parse(localStorage.getItem('usuario') || 'null');
  } catch {
    return null;
  }
}

// Etiqueta del día ("Lunes 4 de agosto"). Desde la agenda llega `startAt` (un
// instante real → zona Colombia); desde la tabla llega `date` (medianoche UTC
// que ya representa el día de calendario → se formatea en UTC).
function dayLabel(appt) {
  try {
    if (appt?.startAt) {
      const d = new Date(appt.startAt).toLocaleDateString('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: 'America/Bogota',
      });
      return d.charAt(0).toUpperCase() + d.slice(1);
    }
    if (appt?.date) {
      const d = new Date(appt.date).toLocaleDateString('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: 'UTC',
      });
      return d.charAt(0).toUpperCase() + d.slice(1);
    }
  } catch {
    /* ignora */
  }
  return '';
}

export function buildConfirmMessage(appt, companyName, senderName) {
  const me = sessionUser();
  const salon = companyName || me?.company?.name || 'nuestro salón';
  const sender = firstName(senderName || me?.name);
  const cliente = firstName(appt?.customer?.name);
  const dayCap = dayLabel(appt);

  const soy = sender ? ` Soy ${sender} de ${salon}.` : '';
  const lines = [
    `¡Hola${cliente ? ` ${cliente}` : ''}!${soy} Te confirmamos tu cita en ${salon}:`,
    '',
    `Servicio: ${appt?.service?.name || 'Servicio'}`,
    `Fecha: ${[dayCap, appt?.startTime].filter(Boolean).join(', ')}`,
  ];
  if (appt?.local?.name) lines.push(`Sede: ${appt.local.name}`);
  if (appt?.barber?.name) lines.push(`Barbero: ${firstName(appt.barber.name)}`);
  lines.push('', '¿Nos confirmas tu asistencia? ¡Te esperamos!');

  return lines.join('\n');
}

export function buildConfirmUrl(appt, companyName, senderName) {
  const phone = normalizePhone(appt?.customer?.phone);
  const text = encodeURIComponent(
    buildConfirmMessage(appt, companyName, senderName)
  );
  return `https://wa.me/${phone}?text=${text}`;
}

// Mensaje LLAMATIVO para reactivar a un cliente que no vuelve hace varios días,
// con un regalo (mascarilla sencilla) para incentivarlo a volver.
export function buildWinbackMessage(customer, companyName, senderName) {
  const me = sessionUser();
  const salon = companyName || me?.company?.name || 'nuestro salón';
  const sender = firstName(senderName || me?.name);
  const nombre = firstName(customer?.name);
  const dias = customer?.days ?? customer?.daysSinceLastVisit;

  const soy = sender ? ` Soy ${sender} de ${salon}.` : '';
  const lines = [
    `¡Hola${nombre ? ` ${nombre}` : ''}! 👋✨${soy}`,
    dias
      ? `Hace ${dias} días que no pasas por ${salon} y te extrañamos. 🥺`
      : `¡Hace rato no te vemos por ${salon} y te extrañamos! 🥺`,
    '',
    `🎁 Tenemos un regalo para ti: vuelve y te obsequiamos una *mascarilla sencilla* en tu próximo corte.`,
  ];
  if (customer?.lastService) {
    lines.push(`Lo último que llevaste fue: ${customer.lastService}.`);
  }
  lines.push('', '¿Cuándo te agendamos tu cita? ¡Te esperamos! 💈');
  return lines.join('\n');
}

export function buildWinbackUrl(customer, companyName, senderName) {
  const phone = normalizePhone(customer?.phone);
  const text = encodeURIComponent(
    buildWinbackMessage(customer, companyName, senderName)
  );
  return `https://wa.me/${phone}?text=${text}`;
}
