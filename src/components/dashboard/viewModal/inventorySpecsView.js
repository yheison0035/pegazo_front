export default function InventorySpecsView({ title, data }) {
  if (!data) return null;

  const isArray = Array.isArray(data);

  const entries = isArray
    ? data.filter((i) => i?.title || i?.key || i?.label)
    : Object.entries(data).filter(([_, v]) => v);

  if (entries.length === 0) return null;

  return (
    <section className="m-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">{title}</h3>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {entries.map((item, idx) => {
            const label = isArray
              ? (item.title ?? item.key ?? item.label)
              : item[0];

            const value = isArray
              ? (item.description ?? item.value ?? item.name ?? '—')
              : item[1];

            return (
              <div
                key={idx}
                className="flex justify-between gap-4 px-6 py-4 bg-white hover:bg-gray-50 transition"
              >
                <span className="text-sm text-gray-700">{label}</span>
                <span className="text-sm font-medium text-gray-900">
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
