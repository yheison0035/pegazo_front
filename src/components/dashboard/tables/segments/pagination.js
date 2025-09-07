export default function Pagination({
  filtered,
  rowsPerPage,
  currentPage,
  totalPages,
  setRowsPerPage,
  setCurrentPage,
}) {
  const handleRowsPerPageChange = (e) => {
    const value =
      e.target.value === 'all' ? filtered.length : Number(e.target.value);
    setRowsPerPage(value);
    setCurrentPage(1);
  };

  const handlePageChange = (direction) => {
    setCurrentPage((prev) => {
      if (direction === 'prev') return Math.max(prev - 1, 1);
      if (direction === 'next') return Math.min(prev + 1, totalPages);
      return prev;
    });
  };

  return (
    <div className="mt-4 flex flex-col md:flex-row justify-end items-center gap-4">
      <div>
        <label htmlFor="rowsPerPage" className="mr-2 text-sm text-gray-700">
          Filas por página:
        </label>
        <select
          id="rowsPerPage"
          value={rowsPerPage === filtered.length ? 'all' : rowsPerPage}
          onChange={handleRowsPerPageChange}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value="all">Todos</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => handlePageChange('prev')}
          disabled={currentPage === 1}
          className="px-2 py-1 border rounded disabled:opacity-50 cursor-pointer"
        >
          Anterior
        </button>
        <span className="text-sm text-gray-700">
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={() => handlePageChange('next')}
          disabled={currentPage === totalPages}
          className="px-2 py-1 border rounded disabled:opacity-50 cursor-pointer"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
