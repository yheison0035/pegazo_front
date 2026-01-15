'use client';
import { colorOptions } from '@/lib/api/utils/getColors';
import { memo, useEffect, useRef, useState } from 'react';

const ColorSelect = memo(function ColorSelect({ value, onChange, disabled }) {
  const safeValue = Array.isArray(value) ? value : [];
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper: buscar si un color ya está seleccionado
  const getVariant = (colorName) =>
    safeValue.find((v) => v.color?.toUpperCase() === colorName.toUpperCase());

  const filteredColors = colorOptions.filter((opt) =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  // Aumentar stock
  const increase = (color) => {
    const existing = getVariant(color);
    if (existing) {
      onChange(
        safeValue.map((v) =>
          v.color?.toUpperCase() === color.toUpperCase()
            ? { ...v, stock: v.stock + 1 }
            : v
        )
      );
    } else {
      onChange([...safeValue, { color, stock: 1 }]);
    }
  };

  // Disminuir stock
  const decrease = (color) => {
    const existing = getVariant(color);
    if (!existing) return;

    if (existing.stock <= 1) {
      onChange(safeValue.filter((v) => v.color !== color));
    } else {
      onChange(
        safeValue.filter((v) => v.color?.toUpperCase() !== color.toUpperCase())
      );
    }
  };

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={`flex items-center justify-between w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm transition ${
          disabled
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
            : 'focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
        }`}
      >
        <span className="text-gray-700">Seleccionar colores</span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && !disabled && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar color..."
              className="w-full border border-gray-200 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="max-h-56 overflow-y-auto">
            {filteredColors.length > 0 ? (
              filteredColors.map((opt) => {
                const variant = getVariant(opt.name);

                return (
                  <div
                    key={`${opt.hex}-${opt.name}`}
                    className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 transition"
                  >
                    {/* Color */}
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full border"
                        style={{ backgroundColor: opt.hex }}
                      />
                      <span className="text-sm">{opt.name}</span>
                    </div>

                    {variant ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => decrease(opt.name)}
                          className="w-7 h-7 rounded-full border text-gray-600 hover:bg-gray-200 cursor-pointer"
                        >
                          −
                        </button>
                        <span className="min-w-[24px] text-center font-semibold">
                          {variant.stock}
                        </span>
                        <button
                          type="button"
                          onClick={() => increase(opt.name)}
                          className="w-7 h-7 rounded-full border text-gray-600 hover:bg-gray-200 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => increase(opt.name)}
                        className="text-sm text-orange-600 hover:underline cursor-pointer"
                      >
                        Agregar
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-2 text-gray-500 text-sm text-center">
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
