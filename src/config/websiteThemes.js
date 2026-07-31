/**
 * Temas y tipografías disponibles para la tienda online.
 * Las claves deben coincidir con las del proyecto de la tienda
 * (src/styles/themes.js y src/styles/fonts.js).
 */

export const WEBSITE_THEMES = [
  {
    id: 'clasico',
    name: 'Clásico',
    description: 'Elegante y sobrio: azul marino con dorado.',
    preview: ['#0b1e3b', '#123a63', '#d4af37', '#d72638'],
  },
  {
    id: 'moderno',
    name: 'Moderno',
    description: 'Limpio y minimalista, con acentos en azul.',
    preview: ['#111827', '#1f2937', '#2563eb', '#2563eb'],
  },
  {
    id: 'vibrante',
    name: 'Vibrante',
    description: 'Enérgico y comercial: naranja sobre fondo oscuro.',
    preview: ['#18181b', '#27272a', '#f97316', '#ea580c'],
  },
];

export const WEBSITE_FONTS = [
  { id: 'inter', name: 'Inter', sample: 'Aa · moderna y neutra' },
  { id: 'poppins', name: 'Poppins', sample: 'Aa · redonda y amable' },
  { id: 'montserrat', name: 'Montserrat', sample: 'Aa · geométrica' },
  { id: 'roboto', name: 'Roboto', sample: 'Aa · clásica de pantalla' },
  { id: 'playfair', name: 'Playfair Display', sample: 'Aa · elegante' },
];

/** Colores del tema, para precargar los selectores cuando no hay propios. */
export function themeColors(themeId) {
  const theme =
    WEBSITE_THEMES.find((item) => item.id === themeId) || WEBSITE_THEMES[0];

  return {
    primaryColor: theme.preview[0],
    secondaryColor: theme.preview[1],
    accentColor: theme.preview[2],
    ctaColor: theme.preview[3],
  };
}
