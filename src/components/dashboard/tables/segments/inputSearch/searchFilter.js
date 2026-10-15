export default function SearchFilter({
  name,
  value = '',
  className = '',
  placeholder,
  showInput,
  title = '',
  type = 'text',
  options,
  handleFilterChange,
}) {
  if (name === 'image') return null;
  if (!showInput) return null;

  // Columnas con valores fijos (p. ej. Tipo: Normal/Electrónica) se filtran con
  // un desplegable en vez de texto libre.
  if (Array.isArray(options) && options.length) {
    return (
      <select
        name={name}
        value={value}
        onChange={handleFilterChange}
        className={className}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

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
