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

  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={handleFilterChange}
      placeholder={placeholder || `Filtrar ${title}`}
      className={className}
    />
  );
}
