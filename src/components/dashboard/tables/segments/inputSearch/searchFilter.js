export default function SearchFilter({
  name = 'campo',
  value = '',
  className = '',
  placeholder,
  title = '',
  type = 'text',
  handleFilterChange = () => {},
}) {
  if (name === 'image') return null;
  const inputId = `filter-${name}`;

  return (
    <>
      <input
        id={inputId}
        type={type}
        name={name}
        value={value}
        onChange={handleFilterChange}
        placeholder={placeholder || `Filtrar ${title}`}
        className={className}
      />
    </>
  );
}
