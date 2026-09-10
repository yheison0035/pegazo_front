'use client';

import { useEffect, useRef, useState } from 'react';
import {
  XMarkIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
} from '@heroicons/react/24/outline';

// Visor de imágenes dentro del sitio (no abre pestañas externas).
// Zoom con la rueda, botones +/- o doble clic; se arrastra para desplazar
// cuando está ampliada. Se cierra con la X, con Esc o tocando el fondo.
export default function ImageLightbox({ src, alt = 'imagen', onClose }) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef(null);

  const clamp = (s) => Math.min(5, Math.max(1, s));

  const reset = () => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  };
  const zoomBy = (delta) =>
    setScale((s) => {
      const next = clamp(+(s + delta).toFixed(2));
      if (next === 1) setPos({ x: 0, y: 0 });
      return next;
    });

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === '+' || e.key === '=') zoomBy(0.5);
      if (e.key === '-') zoomBy(-0.5);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onWheel = (e) => {
    e.preventDefault();
    zoomBy(e.deltaY > 0 ? -0.25 : 0.25);
  };

  const onDoubleClick = () => (scale > 1 ? reset() : setScale(2.5));

  // Arrastre para desplazar la imagen cuando está ampliada.
  const startDrag = (e) => {
    if (scale <= 1) return;
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      x: pos.x,
      y: pos.y,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const moveDrag = (e) => {
    if (!drag.current) return;
    setPos({
      x: drag.current.x + (e.clientX - drag.current.startX),
      y: drag.current.y + (e.clientY - drag.current.startY),
    });
  };
  const endDrag = () => {
    drag.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      {/* Controles */}
      <div
        className="absolute right-4 top-4 z-10 flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => zoomBy(-0.5)}
          title="Alejar"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <MagnifyingGlassMinusIcon className="h-5 w-5" />
        </button>
        <button
          onClick={() => zoomBy(0.5)}
          title="Acercar"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <MagnifyingGlassPlusIcon className="h-5 w-5" />
        </button>
        <button
          onClick={onClose}
          title="Cerrar"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <img
        src={src}
        alt={alt}
        draggable={false}
        onClick={(e) => e.stopPropagation()}
        onWheel={onWheel}
        onDoubleClick={onDoubleClick}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
          cursor: scale > 1 ? 'grab' : 'zoom-in',
          transition: drag.current ? 'none' : 'transform 0.15s ease-out',
        }}
        className="max-h-[85vh] max-w-[90vw] select-none rounded-lg object-contain shadow-2xl"
      />

      <p
        className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/60"
        onClick={(e) => e.stopPropagation()}
      >
        Doble clic o rueda para hacer zoom · arrastra para mover
      </p>
    </div>
  );
}
