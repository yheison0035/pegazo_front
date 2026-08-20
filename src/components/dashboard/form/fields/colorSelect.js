'use client';

import { colorOptions } from '@/lib/api/utils/getColors';
import { memo, useEffect, useRef, useState, useMemo } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Editor de variantes: color + talla (opcional) + stock. Cada combinación de
// color y talla es una variante distinta. Sin talla se comporta como antes.
const ColorSelect = memo(function ColorSelect({ value, onChange, disabled }) {
  const safeValue = Array.isArray(value)
    ? value.filter((v) => v && v.color && v.stock > 0)
    : [];

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [size, setSize] = useState('');
  const ref = useRef(null);

  const key = (color, sz) =>
    `${(color || '').toUpperCase()}|${(sz || '').toUpperCase()}`;

  // Combina duplicados exactos (mismo color y talla), preservando id si existe.
  const variants = useMemo(() => {
    return Object.values(
      safeValue.reduce((acc, v) => {
        if (!v || !v.color) return acc;
        const k = key(v.color, v.size);
        acc[k] = acc[k]
          ? { ...acc[k], stock: acc[k].stock + v.stock }
          : { ...v };
        return acc;
      }, {})
    );
  }, [safeValue]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Variante para el color con la talla actualmente seleccionada.
  const getVariant = (color) =>
    variants.find((v) => key(v.color, v.size) === key(color, size));

  const filteredColors = useMemo(() => {
    const term = search.toLowerCase();
    const list = colorOptions.filter((opt) =>
      opt.name.toLowerCase().includes(term)
    );
    const isSel = (name) =>
      variants.some((v) => key(v.color, v.size) === key(name, size));
    return [...list].sort(
      (a, b) => (isSel(b.name) ? 1 : 0) - (isSel(a.name) ? 1 : 0)
    );
  }, [search, variants, size]);

  const increase = (color) => {
    const existing = getVariant(color);
    if (existing) {
      onChange(
        variants.map((v) =>
          key(v.color, v.size) === key(color, size)
            ? { ...v, stock: v.stock + 1 }
            : v
        )
      );
    } else {
      onChange([...variants, { color, size: size || null, stock: 1 }]);
    }
  };

  const decrease = (color) => {
    const existing = getVariant(color);
    if (!existing) return;
    if (existing.stock === 1) {
      onChange(
        variants.filter((v) => key(v.color, v.size) !== key(color, size))
      );
    } else {
      onChange(
        variants.map((v) =>
          key(v.color, v.size) === key(color, size)
            ? { ...v, stock: v.stock - 1 }
            : v
        )
      );
    }
  };

  const removeVariant = (v) =>
    onChange(variants.filter((x) => key(x.color, x.size) !== key(v.color, v.size)));

  return (
    <div className="relative w-full" ref={ref}>
      {/* Chips de todas las variantes agregadas (color · talla · stock) */}
      {variants.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {variants.map((v) => (
            <span
              key={key(v.color, v.size)}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700"
            >
              {v.color}
              {v.size ? ` · ${v.size}` : ''} · {v.stock}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeVariant(v)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={`flex w-full items-center justify-between rounded-xl border border-gray-200 px-4 py-2 text-sm shadow-sm transition ${
          disabled
            ? 'cursor-not-allowed bg-gray-100 text-gray-500'
            : 'focus:border-orange-500 focus:ring-2 focus:ring-orange-500'
        }`}
      >
        <span className="text-gray-700">Agregar variantes (color / talla)</span>
        <svg
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && !disabled && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="space-y-2 border-b border-gray-100 p-2">
            <input
              type="text"
              value={size}
              onChange={(e) => setSize(e.target.value.toUpperCase())}
              placeholder="Talla (opcional) — ej: S, M, L, 38"
              className="w-full rounded-lg border border-gray-200 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar color..."
              className="w-full rounded-lg border border-gray-200 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {size && (
              <p className="px-1 text-[11px] text-gray-400">
                Agregando talla <b className="text-gray-600">{size}</b>. Cambia
                la talla y agrega más colores para crear otras variantes.
              </p>
            )}
          </div>

          <div className="max-h-56 overflow-y-auto">
            {filteredColors.length > 0 ? (
              filteredColors.map((opt) => {
                const variant = getVariant(opt.name);
                return (
                  <div
                    key={`${opt.hex}-${opt.name}`}
                    className={`flex items-center justify-between px-4 py-2 transition ${
                      variant ? 'bg-orange-50 hover:bg-orange-100' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-5 w-5 rounded-full border"
                        style={{ backgroundColor: opt.hex }}
                      />
                      <span className="text-sm">
                        {opt.name}
                        {size ? (
                          <span className="text-gray-400"> · {size}</span>
                        ) : null}
                      </span>
                    </div>

                    {variant ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => decrease(opt.name)}
                          className="h-7 w-7 cursor-pointer rounded-full border text-gray-600 hover:bg-gray-200"
                        >
                          −
                        </button>
                        <span className="min-w-[24px] text-center font-semibold">
                          {variant.stock}
                        </span>
                        <button
                          type="button"
                          onClick={() => increase(opt.name)}
                          className="h-7 w-7 cursor-pointer rounded-full border text-gray-600 hover:bg-gray-200"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => increase(opt.name)}
                        className="cursor-pointer text-sm text-orange-600 hover:underline"
                      >
                        Agregar
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-2 text-center text-sm text-gray-500">
                No se encuentra ese color.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default ColorSelect;
