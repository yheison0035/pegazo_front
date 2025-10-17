export default function Thead({ header = [] }) {
  return (
    <thead className="bg-gray-100 border-b border-gray-200">
      <tr>
        {header
          .filter((f) => f.show)
          .map(({ name, title }) => (
            <th
              key={name}
              className={`px-4 py-3 ${
                name === 'actions' ? 'text-center' : 'text-left'
              }`}
            >
              {title}
            </th>
          ))}
        <th className="px-5 py-3 text-center">Acciones</th>
      </tr>
    </thead>
  );
}
