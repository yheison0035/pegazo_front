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

  // Los filtros de fecha usan un selector de fecha nativo (envía YYYY-MM-DD),
  // evitando formatos ambiguos escritos a mano.
  const dateColumns = ['saleDate', 'expenseDate', 'date'];
  const isDate = dateColumns.includes(name);
  const inputType = isDate ? 'date' : type;
  const finalPlaceholder = isDate
    ? 'Filtrar por fecha'
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
