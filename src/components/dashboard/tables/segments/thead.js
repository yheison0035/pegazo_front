export default function Thead({ header = [] }) {
  return (
    <thead className="bg-gray-50/70 backdrop-blur sticky top-0 z-10">
      <tr className="text-xs uppercase tracking-wide text-gray-500">
        {header
          .filter((f) => f.show)
          .map(({ name, title }) => (
            <th
              key={name}
              className={`px-5 py-4 font-medium ${
                name === 'actions' ? 'text-center' : 'text-left'
              }`}
            >
              {title}
            </th>
          ))}
        <th className="px-5 py-4 text-center">Acciones</th>
      </tr>
    </thead>
  );
}
