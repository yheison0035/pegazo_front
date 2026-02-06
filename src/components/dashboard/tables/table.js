'use client';

import Thead from './segments/thead';
import InputFilters from './segments/InputsFilters';
import ContentData from './segments/contentData';
import TableSkeleton from '@/components/ui/tableSkeleton';

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
  setPrinterInvoice,
}) => {
  return (
    <table className="min-w-full text-sm text-left text-gray-700">
      <Thead header={header} />

      <tbody>
        {!loading && (
          <InputFilters
            allFilters={header}
            filters={filters}
            handleFilterChange={handleFilterChange}
          />
        )}

        {loading ? (
          <TableSkeleton rows={10} cols={header.length + 1} />
        ) : (
          <ContentData
            paginatedData={info}
            rol={rol}
            view={view}
            setSelected={setSelected}
            setSelectedVariants={setSelectedVariants}
            handleDeleteClick={handleDeleteClick}
            setPrinterInvoice={setPrinterInvoice}
          />
        )}
      </tbody>
    </table>
  );
};

export default Table;
