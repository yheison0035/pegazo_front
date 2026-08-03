'use client';

import { useEffect, useRef, useState } from 'react';
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
  const scrollRef = useRef(null);
  const [shadowRight, setShadowRight] = useState(false);

  // Muestra una sombra en el borde derecho cuando hay más columnas por ver.
  const updateShadow = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShadowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };

  useEffect(() => {
    updateShadow();
    window.addEventListener('resize', updateShadow);
    return () => window.removeEventListener('resize', updateShadow);
  }, [info, loading, header]);

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)]">
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

      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={updateShadow}
          className="overflow-x-auto [scrollbar-width:thin]"
        >
          <table className="crm-table min-w-full text-[13px] text-gray-700 sm:text-sm">
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
              ) : info.length === 0 ? (
                <tr>
                  <td
                    colSpan={header.length + 2}
                    className="px-5 py-14 text-center"
                  >
                    <div className="flex flex-col items-center gap-1 text-gray-400">
                      <span className="text-3xl">🗂️</span>
                      <p className="text-sm font-medium text-gray-500">
                        No se encontraron resultados
                      </p>
                      <p className="text-xs">
                        Ajusta los filtros o crea un nuevo registro.
                      </p>
                    </div>
                  </td>
                </tr>
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

        {/* Indicador de que hay más columnas hacia la derecha. */}
        {shadowRight && (
          <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-black/10 to-transparent" />
        )}
      </div>
    </div>
  );
};

export default Table;
