'use client';

import { useEffect, useRef } from 'react';

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
  filter: drop-shadow(0 1px 3px rgba(0,0,0,.65));
}

/* Fondo fijo del guerrero (siempre visible detrás de todo el flujo) */
[data-skin="dark"] .bk-fixed-bg { position: fixed; inset: 0; z-index: 0; background-size: cover;
  background-position: center 22%; }
[data-skin="dark"] .bk-fixed-bg::after { content: ""; position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(8,7,10,.5) 0%, rgba(8,7,10,.64) 42%, rgba(8,7,10,.82) 100%); }

/* Cuervo pequeño dentro de los botones */
[data-skin="dark"] .bk-btn-raven { height: 1.5em; width: auto; object-fit: contain;
  display: inline-block; vertical-align: middle; filter: drop-shadow(0 1px 2px rgba(0,0,0,.5)); }

/* Textos legibles sobre el fondo */
[data-skin="dark"] .bk-legible { text-shadow: 0 1px 4px rgba(0,0,0,.7); }
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

/* Brasas (canvas) y cuervos */
[data-skin="dark"] .bk-embers { position: fixed; inset: 0; z-index: 1; pointer-events: none; }
[data-skin="dark"] .bk-raven { position: fixed; z-index: 2; color: #0a0810; opacity: .96;
  filter: drop-shadow(1px 1px 0 var(--bk-gold-3)) drop-shadow(-1px -1px 0 var(--bk-gold-3))
    drop-shadow(0 0 7px rgba(212,175,55,.45)); }
[data-skin="dark"] .bk-raven .eye { fill: var(--bk-gold-1); }
[data-skin="dark"] .bk-raven.tl { top: 14px; left: 8px; width: 96px; transform: scaleX(-1); }
[data-skin="dark"] .bk-raven.br { bottom: 112px; right: 8px; width: 104px; }
@keyframes bk-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
[data-skin="dark"] .bk-raven svg { animation: bk-bob 5.5s ease-in-out infinite; }
[data-skin="dark"] .bk-raven.br svg { animation-duration: 6.8s; animation-delay: .6s; }

/* Portada (hero) */
[data-skin="dark"] .bk-hero { position: relative; min-height: 100svh;
  display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
  padding: 16px 0 28px; overflow: hidden; }
[data-skin="dark"] .bk-hero > * { position: relative; z-index: 1; }
/* Capas de fondo (por debajo del contenido). Selector más específico que
   ".bk-hero > *" para que no les quite el position:absolute. */
[data-skin="dark"] .bk-hero > .bk-mts { position: absolute; inset: 0; z-index: 0; overflow: hidden; opacity: .9; }
[data-skin="dark"] .bk-mts svg { position: absolute; bottom: 0; left: -20%; width: 140%; }
[data-skin="dark"] .bk-hero > .bk-axes { position: absolute; top: 44%; left: 50%; width: min(76vw,320px);
  transform: translate(-50%,-60%); z-index: 0; color: var(--bk-gold-2); opacity: .32;
  filter: drop-shadow(0 0 10px rgba(212,175,55,.25)); }
/* Imagen de fondo opcional de la portada (arte real del negocio) */
[data-skin="dark"] .bk-hero > .bk-hero-img { position: absolute; inset: 0; z-index: 0; background-size: cover;
  background-position: center 28%; }
[data-skin="dark"] .bk-hero > .bk-hero-img::after { content: ""; position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(8,7,10,.18) 0%, rgba(8,7,10,.22) 46%, rgba(8,7,10,.72) 78%, var(--bk-bg) 100%); }

[data-skin="dark"] .bk-hero-logo { width: min(58vw,220px); filter: drop-shadow(0 8px 26px rgba(0,0,0,.7));
  animation: bk-logoin 1s cubic-bezier(.2,.7,.2,1) both; }
@keyframes bk-logoin { from { opacity: 0; transform: translateY(-16px) scale(.9) } to { opacity: 1; transform: none } }
[data-skin="dark"] .bk-enter { border: 0; cursor: pointer; border-radius: 40px; padding: 15px 32px;
  font-family: var(--bk-font-display, serif); font-weight: 700; text-transform: uppercase; letter-spacing: .1em; font-size: 15px;
  color: #14100a; background: linear-gradient(180deg, var(--bk-gold-1), var(--bk-gold-2) 55%, var(--bk-gold-3));
  box-shadow: 0 0 0 1px var(--bk-gold-3), 0 12px 34px rgba(212,175,55,.35), inset 0 1px 0 rgba(255,255,255,.6);
  animation: bk-beat 2.6s ease-in-out infinite; }
@keyframes bk-beat { 50% { box-shadow: 0 0 0 1px var(--bk-gold-3), 0 14px 42px rgba(212,175,55,.55), inset 0 1px 0 rgba(255,255,255,.6) } }

/* Menú categorizado (filas de servicio estilo carta) */
[data-skin="dark"] .bk-cat + .bk-cat { margin-top: 16px; }
/* Categoría destacada (Premium) */
[data-skin="dark"] .bk-cat-hi .bk-panel {
  box-shadow: 0 0 0 1px var(--bk-gold-2), 0 0 30px rgba(212,175,55,.3), 0 12px 36px rgba(0,0,0,.55); }
[data-skin="dark"] .bk-hi-tag { display: inline-flex; align-items: center; gap: 4px; margin-left: auto;
  font-size: 10px; letter-spacing: .12em; text-transform: uppercase; font-weight: 700; color: #14100a;
  background: linear-gradient(180deg, var(--bk-gold-1), var(--bk-gold-3)); padding: 3px 9px; border-radius: 20px;
  box-shadow: 0 0 12px rgba(212,175,55,.35); }
[data-skin="dark"] .bk-cathead { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
[data-skin="dark"] .bk-svc { display: flex; align-items: center; gap: 10px; cursor: pointer;
  padding: 11px 6px; border-bottom: 1px solid rgba(212,175,55,.14); transition: .16s; }
[data-skin="dark"] .bk-svc:last-child { border-bottom: 0; }
[data-skin="dark"] .bk-svc:hover { background: rgba(212,175,55,.06); padding-left: 12px; }
[data-skin="dark"] .bk-svc .go { color: var(--bk-gold-3); transition: .16s; }
[data-skin="dark"] .bk-svc:hover .go { color: var(--bk-gold-1); transform: translateX(3px); }

@media (prefers-reduced-motion: reduce) {
  [data-skin="dark"] .bk-shimmer::after,
  [data-skin="dark"] .bk-rise,
  [data-skin="dark"] .bk-hero-logo,
  [data-skin="dark"] .bk-raven svg,
  [data-skin="dark"] .bk-enter,
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

/** Cuervo (silueta) para las esquinas — motivo del menú. */
function RavenSvg() {
  return (
    <svg viewBox="0 0 120 90" aria-hidden="true">
      <g fill="currentColor">
        <path d="M10 62 C24 70 44 70 60 60 C74 52 84 40 96 30 C90 44 82 54 70 62 C86 58 100 50 112 38 C108 56 92 70 72 74 C58 77 40 76 26 70 Z" />
        <circle cx="98" cy="27" r="9" />
        <polygon points="106,24 120,26 106,31" />
        <circle className="eye" cx="100" cy="25" r="1.6" />
        <path d="M8 60 L2 50 L18 58 Z" />
        <path d="M52 66 L50 82 M62 64 L64 80" stroke="currentColor" strokeWidth="2.4" />
      </g>
    </svg>
  );
}
export function Ravens() {
  return (
    <>
      <div className="bk-raven tl"><RavenSvg /></div>
      <div className="bk-raven br"><RavenSvg /></div>
    </>
  );
}

/** Montañas + drakkar para la portada. */
export function MountainsBackdrop() {
  return (
    <svg viewBox="0 0 1200 420" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="bkmg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#1a1622" />
          <stop offset="1" stopColor="#0a0810" />
        </linearGradient>
      </defs>
      <path fill="#12101a" d="M0 260 L160 120 L300 240 L430 90 L560 230 L700 130 L860 250 L1000 110 L1130 240 L1200 180 L1200 420 L0 420Z" />
      <path fill="url(#bkmg)" d="M0 320 L120 220 L260 320 L400 200 L540 320 L700 230 L880 330 L1040 210 L1200 300 L1200 420 L0 420Z" />
      <g fill="#07060b" opacity="0.9" transform="translate(160,300)">
        <path d="M-70 30 Q0 55 70 30 L60 40 Q0 60 -60 40Z" />
        <path d="M-2 30 L-2 -34 L2 -34 L2 30Z" />
        <path d="M2 -30 Q50 -20 44 6 L2 6Z" opacity="0.85" />
        <path d="M-70 30 L-84 20 M70 30 L84 20" stroke="#07060b" strokeWidth="3" />
      </g>
    </svg>
  );
}

/** Hachas cruzadas detrás del logo. */
export function CrossedAxes() {
  return (
    <svg className="bk-axes" viewBox="0 0 320 200" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="6" strokeLinecap="round">
        <line x1="70" y1="180" x2="250" y2="20" />
        <line x1="250" y1="180" x2="70" y2="20" />
      </g>
      <g fill="currentColor" opacity="0.7">
        <path d="M240 10 q40 6 34 40 q-30 10 -44 -14Z" />
        <path d="M80 10 q-40 6 -34 40 q30 10 44 -14Z" />
      </g>
    </svg>
  );
}

/** Brasas doradas ascendentes (canvas ligero). Respeta reduce-motion. */
export function Embers() {
  const ref = useRef(null);
  useEffect(() => {
    const rm =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (rm) return;
    const c = ref.current;
    if (!c) return;
    const x = c.getContext('2d');
    let W, H, raf, P;
    const rs = () => {
      W = c.width = window.innerWidth;
      H = c.height = window.innerHeight;
    };
    const mk = () => ({
      x: Math.random() * W,
      y: H + 10,
      r: Math.random() * 1.8 + 0.4,
      s: Math.random() * 0.5 + 0.2,
      o: Math.random() * 0.5 + 0.2,
      d: (Math.random() - 0.5) * 0.3,
    });
    const loop = () => {
      x.clearRect(0, 0, W, H);
      for (const p of P) {
        p.y -= p.s;
        p.x += p.d;
        p.o -= 0.0016;
        if (p.y < -10 || p.o <= 0) Object.assign(p, mk());
        x.beginPath();
        x.arc(p.x, p.y, p.r, 0, 6.28);
        x.fillStyle = `rgba(230,180,70,${p.o})`;
        x.shadowBlur = 8;
        x.shadowColor = 'rgba(230,170,60,.8)';
        x.fill();
      }
      raf = requestAnimationFrame(loop);
    };
    rs();
    window.addEventListener('resize', rs);
    P = Array.from({ length: 42 }, mk);
    loop();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', rs);
    };
  }, []);
  return <canvas ref={ref} className="bk-embers" />;
}

// Agrupa los servicios en categorías según reglas del negocio (config).
// Cada regla: { title, icon?, any?:[], all?:[], not?:[] } — palabras clave que
// se buscan en el nombre. Primer grupo que hace match se lleva el servicio.
export function groupServices(services, groups) {
  if (!Array.isArray(groups) || !groups.length) return null;
  const norm = (s) =>
    (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  const matches = (name, g) => {
    const n = norm(name);
    const any = (g.any || []).map(norm);
    const all = (g.all || []).map(norm);
    const not = (g.not || []).map(norm);
    if (not.some((w) => w && n.includes(w))) return false;
    if (all.length && !all.every((w) => n.includes(w))) return false;
    if (any.length && !any.some((w) => n.includes(w))) return false;
    if (!any.length && !all.length) return false;
    return true;
  };
  const buckets = groups.map((g) => ({ ...g, items: [] }));
  const rest = [];
  for (const s of services) {
    const idx = buckets.findIndex((g) => matches(s.name, g));
    if (idx >= 0) buckets[idx].items.push(s);
    else rest.push(s);
  }
  const out = buckets.filter((b) => b.items.length);
  if (rest.length) out.push({ title: 'Otros', items: rest });
  return out;
}
