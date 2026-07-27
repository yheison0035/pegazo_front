export default function SearchFilter({
  name,
  value = '',
  className = '',
  placeholder,
  showInput,
  title = '',
  type = 'text',
  handleFilterChange,
}) {
  if (name === 'image') return null;
  if (!showInput) return null;

  // El filtro de fecha de venta usa un selector de fecha nativo (envía
  // YYYY-MM-DD), evitando formatos ambiguos escritos a mano.
  const isDate = name === 'saleDate';
  const inputType = isDate ? 'date' : type;
  const finalPlaceholder = isDate
    ? 'Filtrar por fecha'
    : name === 'expenseDate'
      ? 'Filtrar dd/mm/yyyy'
      : placeholder || `Filtrar ${title}`;

  return (
    <input
      type={inputType}
      name={name}
      value={value}
      onChange={handleFilterChange}
      placeholder={finalPlaceholder}
      className={className}
    />
  );
}
