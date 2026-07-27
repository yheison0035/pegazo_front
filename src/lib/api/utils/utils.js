// TIMEZONE GLOBAL (Colombia)
const TIMEZONE = 'America/Bogota';

// =============================
// PARSE / NORMALIZACIÓN
// =============================

// Convierte cualquier entrada a Date válido
export function parseDate(value) {
  if (!value) return null;

  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

// Devuelve YYYY-MM-DD desde cualquier fecha
export function toISODate(value) {
  const date = parseDate(value);
  if (!date) return null;

  return date.toLocaleDateString('en-CA', {
    timeZone: TIMEZONE,
  });
}

// Normaliza fecha para inputs tipo <input type="date" />
export function normalizeDateForInput(value) {
  const iso = toISODate(value);
  return iso || '';
}

// Normaliza fecha + hora para inputs tipo <input type="datetime-local" />
// Devuelve "YYYY-MM-DDTHH:mm" en la zona horaria de Colombia.
export function normalizeDateTimeForInput(value) {
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
