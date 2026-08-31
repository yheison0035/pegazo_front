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

const VARIANTS = {
  view: 'hover:bg-orange-50 hover:text-orange-600 hover:ring-orange-100',
  edit: 'hover:bg-emerald-50 hover:text-emerald-600 hover:ring-emerald-100',
  delete: 'hover:bg-rose-50 hover:text-rose-600 hover:ring-rose-100',
  success: 'hover:bg-emerald-50 hover:text-emerald-600 hover:ring-emerald-100',
  danger: 'hover:bg-rose-50 hover:text-rose-600 hover:ring-rose-100',
  warning: 'hover:bg-amber-50 hover:text-amber-600 hover:ring-amber-100',
  info: 'hover:bg-blue-50 hover:text-blue-600 hover:ring-blue-100',
  whatsapp: 'hover:bg-green-50 hover:text-green-600 hover:ring-green-100',
  neutral: 'hover:bg-gray-100 hover:text-gray-700 hover:ring-gray-200',
};

const BASE =
  'group/tab relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 ' +
  'ring-1 ring-inset ring-transparent transition-all duration-150 ease-out ' +
  'hover:-translate-y-px hover:shadow-sm ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 ' +
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
