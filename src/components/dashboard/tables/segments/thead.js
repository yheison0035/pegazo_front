export default function Thead({ header = [] }) {
  return (
    <thead className="sticky top-0 z-20 border-b border-gray-200 bg-white text-[10.5px] font-semibold uppercase tracking-[0.08em] text-gray-400">
      <tr>
        {/* Columna de acciones: fija a la izquierda (visible al hacer scroll). */}
        <th className="sticky left-0 z-30 bg-white px-5 py-4 text-center shadow-[inset_-10px_0_8px_-8px_rgba(0,0,0,0.06)]">
          Acciones
        </th>

        {header
          .filter((f) => f.show)
          .map(({ name, title }) => (
            <th
              key={name}
              className={`whitespace-nowrap px-5 py-4 ${
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
