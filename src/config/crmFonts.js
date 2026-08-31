// Fuentes del panel elegibles por el dueño en Ajustes. Las 10 más populares
// del mercado para interfaces + "Predeterminada" (fuente del sistema) para
// revertir. `google` = nombre para el link de Google Fonts; `stack` = font-family.

export const CRM_FONTS = [
  {
    id: 'system',
    name: 'Predeterminada',
    google: null,
    stack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
  { id: 'inter', name: 'Inter', google: 'Inter', stack: "'Inter', system-ui, sans-serif" },
  { id: 'roboto', name: 'Roboto', google: 'Roboto', stack: "'Roboto', system-ui, sans-serif" },
  { id: 'poppins', name: 'Poppins', google: 'Poppins', stack: "'Poppins', system-ui, sans-serif" },
  {
    id: 'montserrat',
    name: 'Montserrat',
    google: 'Montserrat',
    stack: "'Montserrat', system-ui, sans-serif",
  },
  {
    id: 'opensans',
    name: 'Open Sans',
    google: 'Open+Sans',
    stack: "'Open Sans', system-ui, sans-serif",
  },
  { id: 'lato', name: 'Lato', google: 'Lato', stack: "'Lato', system-ui, sans-serif" },
  { id: 'nunito', name: 'Nunito', google: 'Nunito', stack: "'Nunito', system-ui, sans-serif" },
  { id: 'dmsans', name: 'DM Sans', google: 'DM+Sans', stack: "'DM Sans', system-ui, sans-serif" },
  {
    id: 'worksans',
    name: 'Work Sans',
    google: 'Work+Sans',
    stack: "'Work Sans', system-ui, sans-serif",
  },
  {
    id: 'jakarta',
    name: 'Plus Jakarta Sans',
    google: 'Plus+Jakarta+Sans',
    stack: "'Plus Jakarta Sans', system-ui, sans-serif",
  },
];

export const CRM_FONT_IDS = CRM_FONTS.map((f) => f.id);
export const CRM_FONTS_BY_ID = Object.fromEntries(CRM_FONTS.map((f) => [f.id, f]));

// URL de Google Fonts para una fuente (o null para la predeterminada).
export function googleFontHref(id) {
  const f = CRM_FONTS_BY_ID[id];
  if (!f || !f.google) return null;
  return `https://fonts.googleapis.com/css2?family=${f.google}:wght@400;500;600;700&display=swap`;
}
