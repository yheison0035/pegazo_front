export default function SearchFilter({
  name = 'campo',
  value = '',
  className = '',
  placeholder,
  title = '',
  type = 'text',
  handleFilterChange = () => {},
}) {
  const inputId = `filter-${name}`;

  return (
    <>
      <label htmlFor={inputId} className="sr-only">
        Filtrar por {name}
      </label>
      <input
        id={inputId}
        type={type}
        name={name}
        value={value}
        onChange={handleFilterChange}
        placeholder={placeholder || `Filtrar por ${title}`}
        className={className}
      />
    </>
  );
}
