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

const SKINS = {
  // Barbería / guerrero: negro piedra + dorado + ornamentos.
  dark: {
    defaultAccent: '#d4af37',
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

/** Devuelve { style, ornaments, display, isLight } para un skin + acento. */
export function resolveSkin(skinName, accentHex) {
  const skin = SKINS[skinName] || SKINS.classic;
  const accent = accentHex || skin.defaultAccent;
  const rgb = hexToRgb(accent) || hexToRgb(skin.defaultAccent);
  return {
    style: skin.vars(accent, rgb),
    ornaments: skin.ornaments,
    display: skin.display,
    isLight: skinName === 'light',
  };
}

export const SKIN_OPTIONS = [
  { value: 'dark', label: 'Premium oscuro (guerrero)' },
  { value: 'light', label: 'Claro suave (spa / salud)' },
  { value: 'classic', label: 'Clásico neutro' },
];
