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

/* Fondo base: negro con una sutil viñeta gris desde arriba. */
[data-skin="elegant"].bk-elegant {
  background:
    radial-gradient(120% 80% at 50% -10%, #17171a 0%, #0d0d0f 48%, #0a0a0b 100%);
}

/* Imagen de fondo fija (foto real del negocio) tras todo el flujo, tratada en
   escala sobria con degradado para legibilidad. */
[data-skin="elegant"] .bk-fixed-bg {
  position: fixed; inset: 0; z-index: 0;
  background-size: cover; background-position: center 20%;
  filter: grayscale(0.35) contrast(1.02) brightness(0.9);
}
[data-skin="elegant"] .bk-fixed-bg::after {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(180deg,
    rgba(10,10,11,0.55) 0%,
    rgba(10,10,11,0.68) 40%,
    rgba(10,10,11,0.88) 78%,
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

/* El logo del encabezado, discreto y nítido. */
[data-skin="elegant"] .bk-head-logo {
  filter: drop-shadow(0 6px 20px rgba(0,0,0,0.55));
}

/* Respeta la preferencia de menos movimiento. */
@media (prefers-reduced-motion: reduce) {
  [data-skin="elegant"] * { animation: none !important; }
}
`;
