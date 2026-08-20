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

export function buildConfirmMessage(appt, companyName) {
  const cliente = firstName(appt?.customer?.name);
  const dayCap = dayLabel(appt);

  const lines = [
    `¡Hola${cliente ? ` ${cliente}` : ''}! Te confirmamos tu cita en ${
      companyName || 'nuestro salón'
    }:`,
    '',
    `Servicio: ${appt?.service?.name || 'Servicio'}`,
    `Fecha: ${[dayCap, appt?.startTime].filter(Boolean).join(', ')}`,
  ];
  if (appt?.local?.name) lines.push(`Sede: ${appt.local.name}`);
  if (appt?.barber?.name) lines.push(`Barbero: ${firstName(appt.barber.name)}`);
  lines.push('', '¿Nos confirmas tu asistencia? ¡Te esperamos!');

  return lines.join('\n');
}

export function buildConfirmUrl(appt, companyName) {
  const phone = normalizePhone(appt?.customer?.phone);
  const text = encodeURIComponent(buildConfirmMessage(appt, companyName));
  return `https://wa.me/${phone}?text=${text}`;
}

// Mensaje para reactivar a un cliente que no vuelve hace varios días.
export function buildWinbackMessage(customer, companyName) {
  const nombre = firstName(customer?.name);
  const dias = customer?.days;
  const lines = [
    `¡Hola${nombre ? ` ${nombre}` : ''}!`,
    dias
      ? `Notamos que hace ${dias} días no pasas por ${companyName || 'nuestro salón'} y te extrañamos.`
      : `Hace un tiempo que no pasas por ${companyName || 'nuestro salón'} y te extrañamos.`,
  ];
  if (customer?.lastService) {
    lines.push(`Lo último que llevaste con nosotros: ${customer.lastService}.`);
  }
  lines.push(
    '',
    '¡Te esperamos de nuevo! Escríbenos y con gusto te atendemos.'
  );
  return lines.join('\n');
}

export function buildWinbackUrl(customer, companyName) {
  const phone = normalizePhone(customer?.phone);
  const text = encodeURIComponent(buildWinbackMessage(customer, companyName));
  return `https://wa.me/${phone}?text=${text}`;
}
