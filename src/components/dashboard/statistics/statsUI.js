'use client';

// Paleta categórica accesible (validada: CVD ΔE y contraste OK).
export const PALETTE = [
  '#2a78d6', // azul
  '#eb6834', // naranja
  '#1baf7a', // aqua
  '#eda100', // amarillo
  '#e87ba4', // magenta
  '#4a3aa7', // violeta
];

export const COLORS = {
  income: '#1baf7a',
  expense: '#eb6834',
  profit: '#2a78d6',
  grid: '#eef0f2',
  axis: '#6b7280',
};

// Formato de moneda compacto para ejes ($9.6M, $340k).
export function formatShort(value) {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n}`;
}

export function formatMoney(value) {
  return (Number(value) || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  });
}

// Trunca textos largos a una sola línea (con …). El nombre completo se ve
// en el tooltip al pasar el mouse.
export function truncate(str, max = 20) {
  const s = String(str ?? '');
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

// Etiqueta corta de fecha YYYY-MM-DD -> DD/MM
export function shortDate(iso) {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

// -------- KPI Card --------
export function KpiCard({ label, value, delta, invert = false, accent, onClick }) {
  const hasDelta = delta !== null && delta !== undefined;
  const up = hasDelta && delta > 0;
  const down = hasDelta && delta < 0;
  // Para gastos (invert) subir es malo.
  const good = invert ? down : up;
  const bad = invert ? up : down;

  const deltaColor = good
    ? 'text-emerald-600'
    : bad
      ? 'text-red-600'
      : 'text-gray-400';
  const arrow = up ? '▲' : down ? '▼' : '•';

  const clickable = typeof onClick === 'function';
  const Tag = clickable ? 'button' : 'div';

  return (
    <Tag
      {...(clickable
        ? {
            type: 'button',
            onClick,
            title: 'Ver detalle',
          }
        : {})}
      className={`min-w-0 rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition ${
        clickable
          ? 'cursor-pointer hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md'
          : ''
      }`}
    >
      <div className="flex items-center gap-2">
        {accent && (
          <span
            className="inline-block h-2.5 w-2.5 flex-none rounded-full"
            style={{ backgroundColor: accent }}
          />
        )}
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </p>
        {clickable && (
          <span className="ml-auto text-[10px] font-semibold text-orange-500">
            ver ›
          </span>
        )}
      </div>
      <p className="mt-2 break-words text-lg font-bold leading-tight text-gray-900 sm:text-xl xl:text-2xl">
        {value}
      </p>
      {hasDelta && (
        <p className={`mt-1 text-xs font-medium ${deltaColor}`}>
          {arrow} {Math.abs(delta)}%{' '}
          <span className="text-gray-400">vs anterior</span>
        </p>
      )}
    </Tag>
  );
}

// -------- Chart Card --------
export function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// Tooltip con formato de moneda para los gráficos.
export function MoneyTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-md">
      {label && <p className="mb-1 font-semibold text-gray-700">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-gray-600">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: p.color || p.fill }}
          />
          {p.name}:{' '}
          <span className="font-semibold text-gray-800">
            {formatMoney(p.value)}
          </span>
        </p>
      ))}
    </div>
  );
}
