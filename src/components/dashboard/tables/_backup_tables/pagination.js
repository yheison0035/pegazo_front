'use client';

export default function Pagination({
  page,
  totalPages,
  limit,
  setPage,
  setLimit,
}) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-6 py-4 border-t border-gray-100 bg-white/60 backdrop-blur rounded-b-2xl">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Filas:</span>
        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className="px-2 py-1 rounded-lg border border-gray-200 bg-white hover:border-gray-300 focus:ring-2 focus:ring-black/5 outline-none"
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
        >
          ←
        </button>

        <span className="text-sm text-gray-600">
          {page} / {totalPages}
        </span>

        <button
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
        >
          →
        </button>
      </div>
    </div>
  );
}
