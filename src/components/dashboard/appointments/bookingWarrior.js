'use client';

// Dirección de arte del skin "oscuro / guerrero" de la página de citas.
// Todo aquí se activa solo cuando la raíz tiene [data-skin="dark"], así el
// mismo componente sirve para los demás skins (claro/clásico) sin ornamentos.
// Pensado para replicar el menú de RAGNOR: negro piedra + dorado grabado,
// paneles con marco ornamentado, títulos con corchetes angulares, hachas/runas
// y animaciones (entrada escalonada, brillo dorado, glow).

export const WARRIOR_CSS = `
[data-skin="dark"] {
  --bk-frame-glow: 0 0 0 1px var(--bk-frame-soft), 0 8px 30px rgba(0,0,0,0.6);
}

/* Fondo de piedra oscura con vetas y viñeta */
[data-skin="dark"] .bk-stone {
  background:
    radial-gradient(130% 90% at 50% -15%, #16131a 0%, #0b0a0e 45%, #08070a 100%),
    repeating-linear-gradient(115deg, rgba(255,255,255,0.014) 0 2px, transparent 2px 7px);
}

/* Panel ornamentado (cada "parte" del flujo) */
[data-skin="dark"] .bk-panel {
  position: relative;
  background:
    linear-gradient(var(--bk-panel), var(--bk-panel)) padding-box,
    linear-gradient(160deg, var(--bk-gold-1), var(--bk-gold-3) 45%, #3a2d10 100%) border-box;
  border: 1.5px solid transparent;
  border-radius: 18px;
  box-shadow: var(--bk-frame-glow), inset 0 1px 0 rgba(255,255,255,0.04);
}
/* Doble filo interior dorado */
[data-skin="dark"] .bk-panel::after {
  content: "";
  position: absolute;
  inset: 5px;
  border: 1px solid var(--bk-frame-soft);
  border-radius: 13px;
  pointer-events: none;
}
/* Esquinas tipo corchete (las 4) */
[data-skin="dark"] .bk-corner {
  position: absolute;
  width: 16px; height: 16px;
  border-color: var(--bk-gold-2);
  border-style: solid;
  border-width: 0;
  opacity: 0.9;
}
[data-skin="dark"] .bk-corner.tl { top: 9px; left: 9px; border-top-width: 2px; border-left-width: 2px; }
[data-skin="dark"] .bk-corner.tr { top: 9px; right: 9px; border-top-width: 2px; border-right-width: 2px; }
[data-skin="dark"] .bk-corner.bl { bottom: 9px; left: 9px; border-bottom-width: 2px; border-left-width: 2px; }
[data-skin="dark"] .bk-corner.br { bottom: 9px; right: 9px; border-bottom-width: 2px; border-right-width: 2px; }

/* Texto dorado grabado */
[data-skin="dark"] .bk-gold {
  background: linear-gradient(180deg, var(--bk-gold-1) 0%, var(--bk-gold-2) 55%, var(--bk-gold-3) 100%);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; color: transparent;
}
/* Brillo que recorre el título */
[data-skin="dark"] .bk-shimmer {
  position: relative; overflow: hidden;
}
[data-skin="dark"] .bk-shimmer::after {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(100deg, transparent 35%, rgba(255,245,210,0.55) 50%, transparent 65%);
  transform: translateX(-120%);
  animation: bk-shine 4.5s ease-in-out 1s infinite;
}
@keyframes bk-shine { 0% { transform: translateX(-120%); } 40%,100% { transform: translateX(120%); } }

/* Badge circular dorado (como los íconos de categoría del menú) */
[data-skin="dark"] .bk-badge {
  background: radial-gradient(circle at 30% 25%, #241d10, #0b0a0e);
  border: 1.5px solid var(--bk-gold-2);
  box-shadow: 0 0 12px rgba(212,175,55,0.25), inset 0 0 8px rgba(212,175,55,0.15);
}

/* Tarjeta de opción con filo dorado y realce al pasar */
[data-skin="dark"] .bk-card {
  background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
  border: 1px solid rgba(212,175,55,0.22);
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}
[data-skin="dark"] .bk-card:hover {
  border-color: var(--bk-gold-2);
  box-shadow: 0 0 0 1px var(--bk-frame-soft), 0 10px 24px rgba(0,0,0,0.5), 0 0 22px rgba(212,175,55,0.12);
  transform: translateY(-2px);
}
[data-skin="dark"] .bk-card.is-active {
  border-color: var(--bk-gold-2);
  background: linear-gradient(180deg, rgba(212,175,55,0.14), rgba(212,175,55,0.04));
  box-shadow: 0 0 0 1px var(--bk-gold-2), 0 0 26px rgba(212,175,55,0.18);
}

/* Botón principal (reservar) con lustre dorado */
[data-skin="dark"] .bk-cta {
  background: linear-gradient(180deg, var(--bk-gold-1), var(--bk-gold-2) 55%, var(--bk-gold-3));
  color: #14100a;
  box-shadow: 0 8px 26px rgba(212,175,55,0.28), inset 0 1px 0 rgba(255,255,255,0.5);
}
[data-skin="dark"] .bk-cta:hover { filter: brightness(1.06); }

/* Glow suave del paso activo del stepper */
[data-skin="dark"] .bk-step-active {
  box-shadow: 0 0 14px rgba(212,175,55,0.45);
}

/* Entrada escalonada de las tarjetas */
@keyframes bk-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
[data-skin="dark"] .bk-rise { animation: bk-rise .5s cubic-bezier(.2,.7,.2,1) both; }
[data-skin="dark"] .bk-grid > * { animation: bk-rise .5s cubic-bezier(.2,.7,.2,1) both; }
[data-skin="dark"] .bk-grid > *:nth-child(2){animation-delay:.05s}
[data-skin="dark"] .bk-grid > *:nth-child(3){animation-delay:.1s}
[data-skin="dark"] .bk-grid > *:nth-child(4){animation-delay:.15s}
[data-skin="dark"] .bk-grid > *:nth-child(5){animation-delay:.2s}
[data-skin="dark"] .bk-grid > *:nth-child(6){animation-delay:.25s}
[data-skin="dark"] .bk-grid > *:nth-child(7){animation-delay:.3s}
[data-skin="dark"] .bk-grid > *:nth-child(n+8){animation-delay:.35s}

@media (prefers-reduced-motion: reduce) {
  [data-skin="dark"] .bk-shimmer::after,
  [data-skin="dark"] .bk-rise,
  [data-skin="dark"] .bk-grid > * { animation: none; }
}
`;

/** Inserta las 4 esquinas tipo corchete dentro de un panel/tarjeta. */
export function Corners() {
  return (
    <>
      <span className="bk-corner tl" />
      <span className="bk-corner tr" />
      <span className="bk-corner bl" />
      <span className="bk-corner br" />
    </>
  );
}

/** Hacha vikinga (motivo del menú) para divisores. */
function Axe({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M13 2l-1 2-2 .5L4 15l1.6 1.6 6-8.2 1 .3-1 3.3c2.6.4 4.9-.9 6-3.3 1.2-2.6.4-5.6-1.9-7.3L13 2zM5 18l-2 4 4-2 1.3-2.2L6.3 16 5 18z"
      />
    </svg>
  );
}

/** Divisor rúnico dorado con hachas a los lados y estrella al centro. */
export function RuneDivider() {
  return (
    <div className="mx-auto mt-4 flex max-w-xs items-center gap-2 text-[var(--bk-gold-2)]">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--bk-gold-2)]/70" />
      <Axe className="opacity-90 -scale-x-100" />
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5L12 17l-6.5 4.5L8 14l-6-4.5h7.5z" />
      </svg>
      <Axe className="opacity-90" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--bk-gold-2)]/70" />
    </div>
  );
}

/** Corchetes angulares para enmarcar un título, como "⟨ MENÚ DE SERVICIOS ⟩". */
export function AngleBrackets({ children }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span className="text-[var(--bk-gold-2)]/80" aria-hidden="true">◤</span>
      {children}
      <span className="text-[var(--bk-gold-2)]/80" aria-hidden="true">◥</span>
    </span>
  );
}
