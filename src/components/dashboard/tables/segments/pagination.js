'use client';

export default function Pagination({
  page,
  totalPages,
  limit,
  setPage,
  setLimit,
}) {
  return (
    <div className="mt-4 flex flex-col md:flex-row justify-end items-center gap-4 px-4 pb-4">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">Filas por página:</label>
        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className={`px-3 py-1 rounded-md border text-sm transition cursor-pointer
            ${
              page === 1
                ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                : 'text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
        >
          Anterior
        </button>

        <span className="text-sm text-gray-700 font-medium">
          Página <span className="font-semibold">{page}</span> de{' '}
          <span className="font-semibold">{totalPages}</span>
        </span>

        <button
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
          className={`px-3 py-1 rounded-md border text-sm transition cursor-pointer
            ${
              page === totalPages
                ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                : 'text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
