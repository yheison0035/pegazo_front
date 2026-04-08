'use client';
import { memo, useEffect, useRef, useState } from 'react';

const SearchableSelect = memo(function SearchableSelect({
  label = 'Seleccionar',
  name,
  value,
  options = [],
  required = false,
  onChange,
  disabled = false,
  placeholder = 'Buscar...',
}) {
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

  const selectedOption = options.find(
    (opt) => String(opt.id) === String(value)
  );

  const filteredOptions = options.filter((opt) =>
    opt.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={ref}>
      {required && (
        <input
          type="text"
          name={name}
          value={value || ''}
          required={required}
          readOnly
          tabIndex={-1}
          aria-hidden="true"
          style={{
            position: 'absolute',
            opacity: 0,
            height: 0,
            width: 0,
          }}
        />
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={`flex items-center justify-between w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm transition ${
          disabled
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
            : 'focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500'
        }`}
      >
        <span className={selectedOption ? 'text-gray-700' : 'text-gray-400'}>
          {selectedOption ? selectedOption.name : label}
        </span>
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
              placeholder={placeholder}
              className="w-full border border-gray-200 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              autoFocus
            />
          </div>

          <div className="max-h-56 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => {
                    onChange({
                      target: { name, value: opt.id },
                    });
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`flex items-center justify-between px-4 py-2 hover:bg-gray-100 transition cursor-pointer ${
                    String(opt.id) === String(value)
                      ? 'bg-orange-100 text-orange-700 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  <span className="text-sm">{opt.name}</span>

                  {String(opt.id) === String(value) && (
                    <span className="text-xs text-orange-600 font-semibold">
                      Seleccionado
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500 text-sm text-center">
                No se encuentran resultados.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default SearchableSelect;
