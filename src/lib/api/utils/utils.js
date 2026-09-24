// TIMEZONE GLOBAL (Colombia)
const TIMEZONE = 'America/Bogota';

// Dígito de verificación del NIT (algoritmo DIAN). Se calcula, no consulta nada.
export function calcularDV(nit) {
  const cleaned = String(nit || '').replace(/\D/g, '');
  if (!cleaned) return '';

  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const digits = cleaned.split('').reverse();

  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += Number(digits[i]) * (weights[i] || 0);
  }

  const mod = sum % 11;
  return String(mod > 1 ? 11 - mod : mod);
}

// =============================
// PARSE / NORMALIZACIÓN
// =============================

// Convierte cualquier entrada a Date válido
export function parseDate(value) {
  if (!value) return null;

  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

// Devuelve YYYY-MM-DD desde cualquier fecha.
// Se arma manualmente con relleno de ceros (padStart) porque
// toLocaleDateString('en-CA') NO rellena el año a 4 dígitos: para años
// pequeños (los que produce un <input type="date"> mientras se teclea el año,
// p.ej. "0002-09-15") devolvía "2-09-15", un valor inválido que reseteaba el
// input en cada tecla.
export function toISODate(value) {
  const date = parseDate(value);
  if (!date) return null;

  // Las fechas "solo día" se guardan a medianoche UTC; se leen en UTC para
  // no correr el día por la conversión de zona horaria.
  const y = String(date.getUTCFullYear()).padStart(4, '0');
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Normaliza fecha para inputs tipo <input type="date" />.
// Si el valor ya viene como YYYY-MM-DD (lo que produce el propio input), se
// devuelve TAL CUAL, sin reconvertir por Date. Reconvertir en cada tecla
// corrompía lo que el usuario estaba escribiendo (años parciales) y reseteaba
// el campo. Solo se convierte cuando el valor llega como ISO/fecha del servidor.
export function normalizeDateForInput(value) {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const iso = toISODate(value);
  return iso || '';
}

// Día del mes (1-31) a partir de una fecha (YYYY-MM-DD o ISO del servidor).
// Se usa para derivar el "día de pago" desde la fecha de "Cliente desde".
export function dayOfMonthFromDate(value) {
  const iso = normalizeDateForInput(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  return Number(iso.slice(8, 10));
}

// Suma N meses a una fecha YYYY-MM-DD ANCLANDO al día original (si el mes
// destino no tiene ese día, recorta al último día del mes). Devuelve YYYY-MM-DD.
// Es la misma regla del backend (addMonthsAnchored) para que el "pago hasta"
// que se muestra coincida con lo que se guarda.
export function addMonthsToISO(value, months) {
  const iso = normalizeDateForInput(value);
  const n = Number(months);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || !Number.isFinite(n) || n <= 0) {
    return '';
  }
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7)); // 1-12
  const d = Number(iso.slice(8, 10));

  const totalMonths = m - 1 + Math.round(n); // base 0
  const targetY = y + Math.floor(totalMonths / 12);
  const targetM = (totalMonths % 12) + 1; // 1-12
  const lastDay = new Date(Date.UTC(targetY, targetM, 0)).getUTCDate();
  const targetD = Math.min(d, lastDay);

  return `${String(targetY).padStart(4, '0')}-${String(targetM).padStart(2, '0')}-${String(targetD).padStart(2, '0')}`;
}

// Meses (redondeados) entre dos fechas YYYY-MM-DD. Sirve para, al editar una
// empresa en modo paquete, mostrar los meses que representa su "pago hasta".
export function monthsBetweenISO(startValue, endValue) {
  const a = normalizeDateForInput(startValue);
  const b = normalizeDateForInput(endValue);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a) || !/^\d{4}-\d{2}-\d{2}$/.test(b)) return '';
  const ay = Number(a.slice(0, 4));
  const am = Number(a.slice(5, 7));
  const ad = Number(a.slice(8, 10));
  const by = Number(b.slice(0, 4));
  const bm = Number(b.slice(5, 7));
  const bd = Number(b.slice(8, 10));
  let months = (by - ay) * 12 + (bm - am);
  if (bd < ad) months -= 1; // aún no cumple el mes completo
  return months > 0 ? months : '';
}

// Próxima fecha de pago del cobro MENSUAL, calculada desde "Cliente desde"
// (mismo día cada mes, anclado). Si ya hay un "pago hasta" vigente (registró
// pagos), esa ES la próxima fecha; si no, se toma la siguiente ocurrencia del
// día de cobro que caiga de hoy en adelante. Devuelve YYYY-MM-DD.
export function nextMonthlyPaymentDate(startValue, paidUntil) {
  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();
  const todayISO = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  // Si "pago hasta" está vigente, esa es la próxima fecha de pago.
  const paid = normalizeDateForInput(paidUntil);
  if (/^\d{4}-\d{2}-\d{2}$/.test(paid) && paid >= todayISO) return paid;

  const start = normalizeDateForInput(startValue);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return '';

  // Avanza mes a mes (anclado al día de inicio) hasta caer de hoy en adelante.
  for (let k = 0; k <= 1200; k++) {
    const d = k === 0 ? start : addMonthsToISO(start, k);
    if (d && d >= todayISO) return d;
  }
  return '';
}

// Normaliza fecha + hora para inputs tipo <input type="datetime-local" />
// Devuelve "YYYY-MM-DDTHH:mm" en la zona horaria de Colombia.
export function normalizeDateTimeForInput(value) {
  if (!value) return '';
  // Igual que en las fechas: si ya viene como YYYY-MM-DDTHH:mm (lo que teclea
  // el usuario), se respeta tal cual. Reconvertir a zona Colombia en cada tecla
  // desplazaba la hora y hacía "saltar" el campo mientras se editaba.
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return value;
  }
  const date = parseDate(value);
  if (!date) return '';

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type) => parts.find((p) => p.type === type)?.value;
  const hour = get('hour') === '24' ? '00' : get('hour');

  return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}`;
}

// =============================
// FORMATOS VISUALES
// =============================

// Formato DD/MM/YYYY
export function formatDateDMY(value) {
  const date = parseDate(value);
  if (!date) return 'No disponible';

  return date.toLocaleDateString('es-CO', {
    timeZone: TIMEZONE,
  });
}

// Solo fecha en formato DD/MM/YYYY, SIN conversión de zona horaria.
// Para fechas "solo día" (nacimiento, cita, gasto) guardadas a medianoche UTC.
export function formatDateOnly(value) {
  const date = parseDate(value);
  if (!date) return 'No disponible';

  return date.toLocaleDateString('es-CO', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Fecha + hora (formato largo)
export function formatDateTime(value) {
  if (!value) return 'No disponible';

  const date = new Date(value);

  const datePart = date.toLocaleDateString('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const timePart = date.toLocaleTimeString('es-CO', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return `${datePart} · ${timePart}`;
}

// Solo fecha (formato largo)
export function formatDateSafe(value) {
  if (!value) return '';

  return value.split('T')[0];
}

// =============================
// FORMATOS NUMÉRICOS
// =============================

// Formatea número como COP
export function formatCOP(value) {
  if (value === null || value === undefined || value === '') return '';

  const number =
    typeof value === 'string' ? Number(value.replace(/[^\d]/g, '')) : value;

  if (isNaN(number)) return '';

  return number.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  });
}

// Convierte COP formateado a número
export function parseCOPToNumber(value) {
  if (!value) return null;

  if (typeof value === 'number') return value;

  const clean = value.toString().replace(/[^\d]/g, '');
  return clean ? Number(clean) : null;
}

// =============================
// TEXTO
// =============================

// Normaliza texto (sin tildes, uppercase)
export function normalizeText(text) {
  if (!text) return '';

  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

// Cambia mayúsculas/minúsculas
export function toggleCase(text, mode = 'toggle') {
  if (!text) return '';

  switch (mode) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    default:
      return text
        .split('')
        .map((char) =>
          char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()
        )
        .join('');
  }
}

export function buildISODateTime(date, time) {
  if (!date || !time) return null;

  let [hour, minute] = time.split(':');
  minute = minute.substring(0, 2);

  const isPM = time.toLowerCase().includes('p');

  let h = Number(hour);

  if (isPM && h !== 12) h += 12;
  if (!isPM && h === 12) h = 0;

  const formatted = `${date}T${String(h).padStart(2, '0')}:${minute}:00`;

  return new Date(formatted).toISOString();
}

// Formatea texto (quita tildes, caracteres raros y lo deja limpio)
export function formatText(input) {
  if (!input) return '';

  return input
    .normalize('NFD') // separa tildes (á → a)
    .replace(/[\u0300-\u036f]/g, '') // elimina tildes
    .toUpperCase() // mayúsculas
    .replace(/[^A-Z0-9 ]/g, '') // solo letras, números y espacios
    .replace(/\s+/g, ' ') // espacios simples
    .trim();
}

// =============================
// UTILIDADES
// =============================

// Obtener valor por path (obj.a.b.c)
export function getValueByPath(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

// Formatea número con separadores
export function formatPrice(value) {
  if (!value) return '';

  const numberValue = value.toString().replace(/\D/g, '');
  return new Intl.NumberFormat('es-CO').format(Number(numberValue));
}
