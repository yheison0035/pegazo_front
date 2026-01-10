import { useState } from 'react';
import { formatCOP, parseCOP } from './formatCOP';

export function useCOPInput(initialValue = 0) {
  const [rawValue, setRawValue] = useState(initialValue);

  function handleChange(e) {
    const numericValue = parseCOP(e.target.value);
    setRawValue(numericValue);
  }

  return {
    rawValue,
    formattedValue: formatCOP(rawValue),
    handleChange,
  };
}
