export default function Variants({ data, view }) {
  if (!data) return null;

  const isService = view === 'services';

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="bg-gradient-to-r from-orange-600 to-[#111827] px-6 py-5 text-white">
        <h2 className="text-2xl font-bold">{data.name || 'Detalles'}</h2>
        <p className="text-sm opacity-80">
          {isService
            ? 'Precios por local'
            : 'Información completa de las variantes'}
        </p>
      </div>

      <div className="p-6 space-y-3">
        {isService ? (
          data.serviceLocals?.length > 0 ? (
            data.serviceLocals.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-2 items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 transition hover:bg-white hover:shadow-sm"
              >
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Local
                  </p>
                  <p className="font-medium text-gray-800">
                    {item.local?.name || '—'}
                  </p>
                </div>

                <div className="flex justify-end">
                  <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold bg-orange-100 text-orange-700">
                    $ {Number(item.price || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-sm text-gray-500">
              No hay precios configurados por local.
            </p>
          )
        ) : data.variants?.length > 0 ? (
          data.variants.map((variant, index) => (
            <div
              key={index}
              className="grid grid-cols-3 items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 transition hover:bg-white hover:shadow-sm"
            >
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  SKU
                </p>
                <p className="font-medium text-gray-800">
                  {variant.sku || '—'}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Color
                </p>
                <p className="font-medium text-gray-800">
                  {variant.color || '—'}
                </p>
              </div>

              <div className="flex justify-end">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold
                    ${
                      variant?.stock <= 3
                        ? 'bg-red-100 text-red-700'
                        : variant?.stock <= 6
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-green-100 text-green-700'
                    }`}
                >
                  Stock: {variant.stock ?? 0}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-sm text-gray-500">
            No hay variantes disponibles.
          </p>
        )}
      </div>
    </div>
  );
}
