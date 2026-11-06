// "Skins" de la página pública de citas. Cada skin es un set de variables CSS
// que el componente aplica en la raíz; así el mismo layout sirve para una
// barbería oscura tipo guerrero, un spa claro, o un negocio neutro. El color de
// acento sale del color de marca de la empresa (si tiene) y, si no, del default
// del skin. Todo lo demás (fondo, superficies, bordes, texto) lo fija el skin.

// #rrggbb -> "r, g, b" (para usar en rgba()).
function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!m) return null;
  return `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`;
}

// Elige texto negro o blanco según el brillo del color (contraste sobre el acento).
function contrastOn(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';
  const [r, g, b] = rgb.split(',').map((n) => parseInt(n, 10));
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#0a0a0a' : '#ffffff';
}

// Utilidades para derivar tonos a partir de un color (mezclar, aclarar, oscurecer).
function parseHex(hex) {
  const rgb = hexToRgb(hex);
  return rgb ? rgb.split(',').map((n) => parseInt(n, 10)) : [0, 0, 0];
}
function toHex(r, g, b) {
  const c = (x) =>
    Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
function mix(a, b, t) {
  const A = parseHex(a);
  const B = parseHex(b);
  return toHex(
    A[0] + (B[0] - A[0]) * t,
    A[1] + (B[1] - A[1]) * t,
    A[2] + (B[2] - A[2]) * t,
  );
}
const lighten = (hex, t) => mix(hex, '#ffffff', t);
const darken = (hex, t) => mix(hex, '#000000', t);

const SKINS = {
  // Barbería / guerrero: negro piedra + dorado + ornamentos.
  dark: {
    defaultAccent: '#d4af37',
    backdrop: true,
    vars: (accent, rgb) => ({
      '--bk-bg': '#08070a',
      '--bk-bg-2': '#0e0d12',
      '--bk-surface': 'rgba(255,255,255,0.028)',
      '--bk-surface-2': 'rgba(255,255,255,0.05)',
      '--bk-border': 'rgba(255,255,255,0.09)',
      '--bk-border-strong': `rgba(${rgb}, 0.55)`,
      '--bk-text': '#f4efe4',
      '--bk-text-muted': '#9a958c',
      '--bk-accent': accent,
      '--bk-accent-2': accent,
      '--bk-accent-contrast': contrastOn(accent),
      '--bk-accent-soft': `rgba(${rgb}, 0.12)`,
      '--bk-accent-ring': `rgba(${rgb}, 0.35)`,
      '--bk-radius': '0.9rem',
      // Degradado dorado grabado (como el menú): claro -> oro -> bronce.
      '--bk-gold-1': '#f7e7a8',
      '--bk-gold-2': accent,
      '--bk-gold-3': '#8a6a1f',
      '--bk-frame': `rgba(${rgb}, 0.85)`,
      '--bk-frame-soft': `rgba(${rgb}, 0.28)`,
      '--bk-panel': 'rgba(10,9,12,0.72)',
    }),
    ornaments: true,
    display: true,
  },
  // Spa / estética / salud: claro, suave, aireado.
  light: {
    defaultAccent: '#b08968',
    vars: (accent, rgb) => ({
      '--bk-bg': '#faf7f4',
      '--bk-bg-2': '#f3efe9',
      '--bk-surface': '#ffffff',
      '--bk-surface-2': '#f7f3ee',
      '--bk-border': '#ece6de',
      '--bk-border-strong': `rgba(${rgb}, 0.5)`,
      '--bk-text': '#26211c',
      '--bk-text-muted': '#8a8178',
      '--bk-accent': accent,
      '--bk-accent-2': accent,
      '--bk-accent-contrast': contrastOn(accent),
      '--bk-accent-soft': `rgba(${rgb}, 0.1)`,
      '--bk-accent-ring': `rgba(${rgb}, 0.28)`,
      '--bk-radius': '1.1rem',
    }),
    ornaments: false,
    display: false,
  },
  // Elegante / alta gama: negro + gris + plateado. Minimalista, hairlines finas,
  // tipografía fina con tracking, acento plateado. Usa imagen de fondo (como el
  // oscuro) pero SIN ornamentos ni portada. Pensado para barbería/estética premium.
  elegant: {
    defaultAccent: '#c9ccd1', // plateado
    backdrop: true,
    // 3 colores configurables: negro (fondos), gris (líneas/recuadros/apagados)
    // y plateado (= acento: botones, títulos, selección). Todo lo demás se
    // deriva de esos tres. opts = { black, gray }.
    vars: (accent, rgb, opts = {}) => {
      const silver = accent; // el acento ES el plateado
      const black = opts.black || '#0a0a0b';
      const gray = opts.gray || '#8b8b92';
      const blackRgb = hexToRgb(black) || '10,10,11';
      const grayRgb = hexToRgb(gray) || '139,139,146';
      const silverRgb = rgb;
      return {
        '--bk-bg': black,
        '--bk-bg-rgb': blackRgb,
        '--bk-bg-2': mix(black, gray, 0.1),
        // Elevaciones para el degradado de fondo (negro levemente levantado).
        '--bk-elev-1': mix(black, gray, 0.08),
        '--bk-elev-2': mix(black, gray, 0.16),
        // Recuadros: gris muy sutil sobre el negro.
        '--bk-surface': `rgba(${grayRgb}, 0.06)`,
        '--bk-surface-2': `rgba(${grayRgb}, 0.12)`,
        // Líneas: gris.
        '--bk-border': `rgba(${grayRgb}, 0.3)`,
        '--bk-border-strong': `rgba(${silverRgb}, 0.5)`,
        '--bk-text': lighten(gray, 0.82),
        '--bk-text-muted': gray,
        // Botones / acento: plateado.
        '--bk-accent': silver,
        '--bk-accent-2': silver,
        '--bk-accent-contrast': contrastOn(silver),
        '--bk-accent-soft': `rgba(${silverRgb}, 0.12)`,
        '--bk-accent-ring': `rgba(${silverRgb}, 0.35)`,
        '--bk-radius': '0.6rem',
        // Degradado plateado para títulos (claro -> plata -> grafito).
        '--bk-silver-1': lighten(silver, 0.55),
        '--bk-silver-2': silver,
        '--bk-silver-3': darken(silver, 0.4),
        '--bk-panel': `rgba(${blackRgb}, 0.66)`,
      };
    },
    ornaments: false,
    display: true,
  },
  // Neutro por defecto (cualquier negocio).
  classic: {
    defaultAccent: '#ea580c',
    vars: (accent, rgb) => ({
      '--bk-bg': '#0b1120',
      '--bk-bg-2': '#111a2e',
      '--bk-surface': 'rgba(255,255,255,0.03)',
      '--bk-surface-2': 'rgba(255,255,255,0.06)',
      '--bk-border': 'rgba(255,255,255,0.1)',
      '--bk-border-strong': `rgba(${rgb}, 0.5)`,
      '--bk-text': '#f8fafc',
      '--bk-text-muted': '#94a3b8',
      '--bk-accent': accent,
      '--bk-accent-2': accent,
      '--bk-accent-contrast': contrastOn(accent),
      '--bk-accent-soft': `rgba(${rgb}, 0.12)`,
      '--bk-accent-ring': `rgba(${rgb}, 0.35)`,
      '--bk-radius': '0.9rem',
    }),
    ornaments: false,
    display: false,
  },
};

/**
 * Devuelve { style, ornaments, display, backdrop, isLight } para un skin.
 * `opts` lleva colores extra configurables (skin elegante: { black, gray }).
 */
export function resolveSkin(skinName, accentHex, opts = {}) {
  const skin = SKINS[skinName] || SKINS.classic;
  const accent = accentHex || skin.defaultAccent;
  const rgb = hexToRgb(accent) || hexToRgb(skin.defaultAccent);
  return {
    style: skin.vars(accent, rgb, opts),
    ornaments: skin.ornaments,
    display: skin.display,
    // ¿Usa imagen de fondo fija detrás de todo el flujo? (oscuro y elegante).
    backdrop: !!skin.backdrop,
    isLight: skinName === 'light',
  };
}

export const SKIN_OPTIONS = [
  { value: 'dark', label: 'Premium oscuro (guerrero)' },
  { value: 'elegant', label: 'Elegante (negro / gris / plateado)' },
  { value: 'light', label: 'Claro suave (spa / salud)' },
  { value: 'classic', label: 'Clásico neutro' },
];
