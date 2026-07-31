'use client';

import Thead from './segments/thead';
import InputFilters from './segments/InputsFilters';
import ContentData from './segments/contentData';
import TableSkeleton from '@/components/ui/tableSkeleton';
import Pagination from './segments/pagination';

const Table = ({
  header,
  info = [],
  view,
  rol,
  loading = false,
  filters,
  handleFilterChange,
  setSelected,
  setSelectedVariants,
  handleDeleteClick,
  handleToggleStatus,
  setPrinterInvoice,
  meta,
  limit,
  setPage,
  setLimit,
}) => {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white/70 backdrop-blur-xl shadow-sm">
      {meta && setPage && (
        <div className="border-b border-gray-100">
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            limit={limit}
            setPage={setPage}
            setLimit={(newLimit) => {
              setLimit?.(newLimit);
              setPage(1);
            }}
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-gray-700">
          <Thead header={header} />

          <tbody className="divide-y divide-gray-100">
            {!loading && (
              <InputFilters
                allFilters={header}
                filters={filters}
                handleFilterChange={handleFilterChange}
              />
            )}

            {loading ? (
              <TableSkeleton rows={8} cols={header.length + 1} />
            ) : (
              <ContentData
                paginatedData={info}
                rol={rol}
                view={view}
                setSelected={setSelected}
                setSelectedVariants={setSelectedVariants}
                handleDeleteClick={handleDeleteClick}
                handleToggleStatus={handleToggleStatus}
                setPrinterInvoice={setPrinterInvoice}
              />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
