'use client';

import { useState } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

// Ícono de información que, al tocar/pasar el mouse, muestra una explicación.
// Usa posición FIJA (calculada desde el botón) para que NO la recorte el scroll
// del modal, y funciona igual en móvil (tap) y escritorio (hover/clic).
export default function CourtesyInfo({
  text,
  className = 'text-orange-500',
}) {
  const [pos, setPos] = useState(null); // {x, y} o null (cerrado)

  const open = (e) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ x: r.left + r.width / 2, y: r.top });
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        onMouseEnter={open}
        onMouseLeave={() => setPos(null)}
        aria-label="Por qué"
        className={`inline-flex flex-none cursor-help ${className}`}
      >
        <InformationCircleIcon className="h-4 w-4" />
      </button>
      {pos && (
        <>
          {/* Capa para cerrar al tocar fuera (móvil). */}
          <div
            className="fixed inset-0 z-[60]"
            onClick={() => setPos(null)}
          />
          <span
            className="fixed z-[61] w-52 -translate-x-1/2 -translate-y-full rounded-lg bg-gray-900 px-2.5 py-1.5 text-[11px] font-normal leading-snug text-white shadow-xl"
            style={{ left: pos.x, top: pos.y - 6 }}
          >
            {text}
          </span>
        </>
      )}
    </>
  );
}
