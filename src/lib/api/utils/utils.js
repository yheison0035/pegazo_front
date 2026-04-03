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
  const date = parseDate(value);
  if (!date) return 'No disponible';

  return date.toLocaleString('es-CO', {
    timeZone: TIMEZONE,
    dateStyle: 'long',
    timeStyle: 'short',
  });
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
