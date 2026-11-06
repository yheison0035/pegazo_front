// Estilos del skin "elegant" (negro / gris / plateado) de la página de citas.
// Minimalista y de alta gama: hairlines finas, tipografía ligera con tracking,
// acento plateado y una imagen de fondo tratada con viñeta. NO usa ornamentos
// ni portada. Es genérico: no incluye ninguna marca propia (el logo lo pone
// cada negocio desde su configuración). Se inyecta solo cuando el skin activo
// es "elegant" y todo se controla con las variables --bk-* del skin.
export const ELEGANT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600&display=swap');

[data-skin="elegant"] {
  --bk-font-display: 'Jost', ui-sans-serif, system-ui, sans-serif;
  letter-spacing: 0.01em;
}

/* Fondo base: el NEGRO configurado con una sutil viñeta (negro levantado con
   algo de gris) desde arriba. Todo sale de los 3 colores del skin. */
[data-skin="elegant"].bk-elegant {
  background:
    radial-gradient(120% 80% at 50% -10%,
      var(--bk-elev-2) 0%, var(--bk-elev-1) 48%, var(--bk-bg) 100%);
}

/* Imagen de fondo fija (foto real del negocio) tras todo el flujo, tratada en
   escala sobria con degradado para legibilidad. Se adapta a CUALQUIER pantalla:
   'cover' rellena siempre el viewport (recorta lo que sobra) y queda centrada,
   tanto en móvil vertical como en escritorio. */
[data-skin="elegant"] .bk-fixed-bg {
  position: fixed; inset: 0; z-index: 0;
  width: 100%; height: 100%;
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  filter: grayscale(0.35) contrast(1.02) brightness(0.9);
}
[data-skin="elegant"] .bk-fixed-bg::after {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(180deg,
    rgba(var(--bk-bg-rgb), 0.55) 0%,
    rgba(var(--bk-bg-rgb), 0.68) 40%,
    rgba(var(--bk-bg-rgb), 0.88) 78%,
    var(--bk-bg) 100%);
}

/* Título en plateado grabado (equivalente sobrio al dorado del oscuro). */
[data-skin="elegant"] .bk-silver {
  background: linear-gradient(180deg,
    var(--bk-silver-1) 0%, var(--bk-silver-2) 55%, var(--bk-silver-3) 100%);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; color: transparent;
}

/* Filete plateado fino bajo el encabezado. */
[data-skin="elegant"] .bk-hairline {
  height: 1px; width: 56px; margin: 14px auto 0;
  background: linear-gradient(90deg, transparent, var(--bk-border-strong), transparent);
}

/* Tarjetas: hairline fina, superficie casi plana, realce plateado al activarse. */
[data-skin="elegant"] .bk-card {
  border-width: 1px; border-radius: var(--bk-radius);
  backdrop-filter: blur(2px);
  transition: border-color .18s ease, background-color .18s ease, transform .18s ease;
}
[data-skin="elegant"] .bk-card.is-active {
  box-shadow: 0 0 0 1px var(--bk-accent-ring), 0 10px 30px rgba(0,0,0,0.45);
}

/* ---- Menú de servicios por categoría (recuadros con borde fino) ---- */

/* Separación entre categorías. */
[data-skin="elegant"] .bk-cat + .bk-cat { margin-top: 18px; }

/* Cabecera de la categoría: insignia + título alineados. */
[data-skin="elegant"] .bk-cathead {
  display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
}
[data-skin="elegant"] .bk-badge {
  background: var(--bk-surface);
  border: 1px solid var(--bk-border);
}
/* Título de la categoría en plateado (reusa el degradado de --bk-silver-*). */
[data-skin="elegant"] .bk-gold {
  background: linear-gradient(180deg,
    var(--bk-silver-1) 0%, var(--bk-silver-2) 55%, var(--bk-silver-3) 100%);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; color: transparent;
}
/* Etiqueta "Recomendado". */
[data-skin="elegant"] .bk-hi-tag {
  display: inline-flex; align-items: center; gap: 4px; margin-left: auto;
  font-size: 10px; letter-spacing: .12em; text-transform: uppercase; font-weight: 700;
  color: var(--bk-accent-contrast);
  background: var(--bk-accent);
  padding: 3px 9px; border-radius: 20px;
}

/* El RECUADRO de cada categoría: borde fino, fondo sutil, esquinas suaves. */
[data-skin="elegant"] .bk-panel {
  background: var(--bk-surface);
  border: 1px solid var(--bk-border);
  border-radius: calc(var(--bk-radius) + 4px);
  overflow: hidden;
  padding: 0 !important;
}
/* Categoría destacada: borde plateado. */
[data-skin="elegant"] .bk-cat-hi .bk-panel {
  border-color: var(--bk-border-strong);
}

/* Cada servicio es una fila con divisor fino; la última sin divisor. */
[data-skin="elegant"] .bk-svc {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--bk-border);
  transition: background-color .16s ease;
}
[data-skin="elegant"] .bk-svc:last-child { border-bottom: 0; }
[data-skin="elegant"] .bk-svc:hover { background: var(--bk-surface-2); }
[data-skin="elegant"] .bk-svc .go { color: var(--bk-accent); line-height: 1; }

/* Respeta la preferencia de menos movimiento. */
@media (prefers-reduced-motion: reduce) {
  [data-skin="elegant"] * { animation: none !important; }
}
`;
