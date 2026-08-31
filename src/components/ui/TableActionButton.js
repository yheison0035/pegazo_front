'use client';

import { useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

/**
 * Botón de acción para tablas: icono minimalista con tooltip profesional.
 *
 * - Estado en reposo neutro (gris) y color solo al pasar el cursor, para que la
 *   fila no se sienta "ruidosa".
 * - Tooltip renderizado en un portal (position: fixed) para que NO lo recorte el
 *   overflow-x-auto de la tabla; aparece con hover y también con foco de teclado.
 *
 * Props:
 *  - icon:     componente de heroicon (opcional si se usa children)
 *  - label:    texto del tooltip (obligatorio, también sirve de aria-label)
 *  - variant:  color de acento en hover (ver VARIANTS)
 *  - onClick / href / disabled
 */

// Cada acción lleva su color desde el reposo (fondo suave + icono con color)
// para que se vea activa y clickeable; el hover lo intensifica.
const VARIANTS = {
  view: 'bg-orange-50 text-orange-600 ring-orange-100 hover:bg-orange-100 hover:ring-orange-200',
  edit: 'bg-emerald-50 text-emerald-600 ring-emerald-100 hover:bg-emerald-100 hover:ring-emerald-200',
  delete: 'bg-rose-50 text-rose-600 ring-rose-100 hover:bg-rose-100 hover:ring-rose-200',
  success: 'bg-emerald-50 text-emerald-600 ring-emerald-100 hover:bg-emerald-100 hover:ring-emerald-200',
  danger: 'bg-rose-50 text-rose-600 ring-rose-100 hover:bg-rose-100 hover:ring-rose-200',
  warning: 'bg-amber-50 text-amber-600 ring-amber-100 hover:bg-amber-100 hover:ring-amber-200',
  info: 'bg-blue-50 text-blue-600 ring-blue-100 hover:bg-blue-100 hover:ring-blue-200',
  whatsapp: 'bg-green-50 text-green-600 ring-green-100 hover:bg-green-100 hover:ring-green-200',
  neutral: 'bg-gray-100 text-gray-600 ring-gray-200 hover:bg-gray-200 hover:ring-gray-300',
};

const BASE =
  'group/tab relative inline-flex h-9 w-9 items-center justify-center rounded-lg ' +
  'ring-1 ring-inset transition-all duration-150 ease-out ' +
  'hover:-translate-y-px hover:shadow-sm active:translate-y-0 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ' +
  'disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40';

export default function TableActionButton({
  icon: Icon,
  label,
  variant = 'neutral',
  onClick,
  href,
  disabled = false,
  children,
}) {
  const ref = useRef(null);
  const [tip, setTip] = useState(null); // {left, top} o null

  const show = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setTip({ left: r.left + r.width / 2, top: r.top });
  }, []);

  const hide = useCallback(() => setTip(null), []);

  const cls = `${BASE} ${VARIANTS[variant] || VARIANTS.neutral}`;
  const inner = children || (Icon ? <Icon className="h-[18px] w-[18px]" /> : null);

  const tooltip =
    tip && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="pointer-events-none fixed z-[9999] -translate-x-1/2 -translate-y-full"
            style={{ left: tip.left, top: tip.top - 8 }}
          >
            <div className="relative rounded-md bg-gray-900 px-2.5 py-1 text-[11px] font-medium text-white shadow-lg whitespace-nowrap">
              {label}
              <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-gray-900" />
            </div>
          </div>,
          document.body,
        )
      : null;

  const commonProps = {
    ref,
    className: cls,
    'aria-label': label,
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
  };

  if (href && !disabled) {
    return (
      <>
        <Link href={href} {...commonProps} onClick={hide}>
          {inner}
        </Link>
        {tooltip}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          hide();
          onClick?.(e);
        }}
        {...commonProps}
      >
        {inner}
      </button>
      {tooltip}
    </>
  );
}
