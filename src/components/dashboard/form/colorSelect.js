'use client';
import { colorOptions } from '@/lib/api/utils/getColors';
import { useEffect, useRef, useState } from 'react';

export default function ColorSelect({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  const selected = colorOptions.find((opt) => opt.hex === value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredColors = colorOptions.filter((opt) =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

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
        {selected ? (
          <div className="flex items-center gap-2">
            <span
              className="w-5 h-5 rounded-full border"
              style={{ backgroundColor: selected.hex }}
            />
            <span>{selected.name}</span>
          </div>
        ) : (
          <span className="text-gray-500">Seleccione un color</span>
        )}
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

          <div className="max-h-48 overflow-y-auto">
            {filteredColors.length > 0 ? (
              filteredColors.map((opt) => (
                <div
                  key={`${opt.hex}-${opt.name}`}
                  onClick={() => {
                    onChange(opt.hex);
                    setOpen(false);
                    setSearch('');
                  }}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer transition"
                >
                  <span
                    className="w-5 h-5 rounded-full border"
                    style={{ backgroundColor: opt.hex }}
                  />
                  <span>{opt.name}</span>
                </div>
              ))
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
}
