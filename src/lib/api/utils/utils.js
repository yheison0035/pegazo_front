// Convierte una fecha en formato DD/MM/YYYY o cualquier formato reconocible por Date a ISO completo
export function toFullISO(input) {
  if (!input) return null;

  if (typeof input === 'string' && input.includes('/')) {
    const [d, m, y] = input.split('/').map((p) => p.trim());
    const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    const dt = new Date(iso);
    return isNaN(dt.getTime()) ? null : dt.toISOString();
  }

  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export function formatDateDMY(value) {
  if (!value) return 'No disponible';

  return new Date(value).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Convierte una fecha (YYYY-MM-DD) a fecha+hora local real en ISO
export function toLocalDateTimeISO(input) {
  if (!input) return null;

  // Si ya viene como ISO completo, solo lo normalizamos
  if (typeof input === 'string' && input.includes('T')) {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  // Si viene como YYYY-MM-DD (input date)
  if (typeof input === 'string' && input.includes('-')) {
    const [year, month, day] = input.split('-').map(Number);

    const now = new Date(); // hora actual local

    const localDateTime = new Date(
      year,
      month - 1,
      day,
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
      now.getMilliseconds()
    );

    return isNaN(localDateTime.getTime()) ? null : localDateTime.toISOString();
  }

  // Fallback genérico
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

//
export function formatDateTime(value) {
  if (!value) return 'No disponible';

  return new Date(value).toLocaleString('es-CO', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

// Normaliza una fecha para usar en inputs tipo date (YYYY-MM-DD)
export function normalizeDateForInput(input) {
  if (!input) return '';

  const d = new Date(input);
  if (isNaN(d.getTime())) return '';

  return d.toISOString().split('T')[0];
}

// Formatea un valor numérico agregando separadores de miles
export const formatPrice = (value) => {
  if (!value) return '';
  const numberValue = value.toString().replace(/\D/g, '');
  return new Intl.NumberFormat('es-CO').format(Number(numberValue));
};

// Formatea un número o cadena como moneda COP
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

// Convierte un valor formateado en COP a número
export function parseCOPToNumber(value) {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'number') return value;

  const clean = value.toString().replace(/[^\d]/g, '');

  if (!clean) return null;

  return Number(clean);
}

// Obtiene el valor de un objeto dado una ruta en notación de puntos
export const getValueByPath = (obj, path) => {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
};

// Normaliza texto: quita tildes, pasa a mayúsculas, elimina caracteres especiales y espacios extras
export function formatText(input) {
  if (!input) return '';

  return input
    .normalize('NFD') // separa tildes (á → a)
    .replace(/[\u0300-\u036f]/g, '') // elimina tildes
    .toUpperCase() // todo en mayúscula
    .replace(/[^A-Z0-9 ]/g, '') // solo letras, números y espacios
    .replace(/\s+/g, ' ') // un solo espacio
    .trim(); // sin espacios al inicio/final
}

// Cambia el caso de un texto según el modo especificado
export function toggleCase(text, modeText = 'toggle') {
  if (!text) return '';

  switch (modeText) {
    case 'uppercase':
      return text.toUpperCase();

    case 'lowercase':
      return text.toLowerCase();

    case 'toggle':
    default:
      return text
        .split('')
        .map((char) => {
          if (char === char.toUpperCase()) return char.toLowerCase();
          if (char === char.toLowerCase()) return char.toUpperCase();
          return char;
        })
        .join('');
  }
}

// Normaliza texto: quita tildes, pasa a mayúsculas y elimina espacios extras
export function normalizeText(text) {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}
