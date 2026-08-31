'use client';

import { formatCOP, parseCOPToNumber } from '@/lib/api/utils/utils';

// Input de valor en formato moneda (COP) como en todo el sitio. Muestra
// "$ 800.000" y devuelve el número por onChange. `value` puede ser número o ''.
export default function MoneyInput({
  value,
  onChange,
  className = '',
  placeholder = '$ 0',
  ...rest
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value === '' || value === null || value === undefined ? '' : formatCOP(value)}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const n = parseCOPToNumber(e.target.value);
        onChange(n === null ? '' : n);
      }}
      placeholder={placeholder}
      className={className}
      {...rest}
    />
  );
}
