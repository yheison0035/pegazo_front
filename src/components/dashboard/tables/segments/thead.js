export default function Thead({ header = [] }) {
  return (
    <thead className="sticky top-0 z-20 bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 shadow-sm">
      <tr>
        {/* Columna de acciones: fija a la izquierda (visible al hacer scroll). */}
        <th className="sticky left-0 z-30 bg-gray-50 px-5 py-3.5 text-center font-semibold shadow-[inset_-10px_0_8px_-8px_rgba(0,0,0,0.08)]">
          Acciones
        </th>

        {header
          .filter((f) => f.show)
          .map(({ name, title }) => (
            <th
              key={name}
              className={`whitespace-nowrap px-5 py-3.5 font-semibold ${
                name === 'actions' ? 'text-center' : 'text-left'
              }`}
            >
              {title}
            </th>
          ))}
      </tr>
    </thead>
  );
}
