'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

// Ícono de información que, al tocar/hacer clic, muestra una explicación. El
// globo se pinta con un PORTAL en el <body> y posición FIJA, así NO lo recorta
// el scroll de ningún modal y funciona igual en móvil (tap) y escritorio.
export default function CourtesyInfo({
  text,
  className = 'text-orange-500',
}) {
  const [pos, setPos] = useState(null); // {x, y} o null (cerrado)
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!pos) return;
    const close = () => setPos(null);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [pos]);

  const toggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (pos) {
      setPos(null);
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ x: r.left + r.width / 2, y: r.top });
  };

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-label="Por qué"
        className={`inline-flex flex-none cursor-pointer align-middle ${className}`}
      >
        <InformationCircleIcon className="h-4 w-4" />
      </button>
      {mounted &&
        pos &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[9998]"
              onClick={() => setPos(null)}
            />
            <div
              className="fixed z-[9999] w-56 max-w-[80vw] -translate-x-1/2 -translate-y-full rounded-lg bg-gray-900 px-3 py-2 text-xs font-normal normal-case leading-snug text-white shadow-xl"
              style={{ left: pos.x, top: pos.y - 6 }}
            >
              {text}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
