'use client';

import { useEffect, useRef, useState } from 'react';
import Thead from './segments/thead';
import InputFilters from './segments/InputsFilters';
import ContentData from './segments/contentData';
import TableSkeleton from '@/components/ui/tableSkeleton';
import Pagination from './segments/pagination';
import SearchFilter from './segments/inputSearch/searchFilter';
import {
  InboxIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

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
  const tableRef = useRef(null);
  // En móvil la fila de filtros se oculta (diseño de tarjetas); mostramos un
  // panel de búsqueda propio, colapsable.
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const searchableCols = (header || []).filter((f) => f.show && f.showInput);
  const activeFilters = searchableCols.filter((f) => filters?.[f.name]).length;
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

  // Etiqueta cada celda con el nombre de su columna (data-label). En móvil, el
  // CSS convierte cada fila en una tarjeta "etiqueta: valor" (0 scroll lateral).
  // Es genérico: sirve para todas las tablas sin tocar cada vista.
  useEffect(() => {
    if (!tableRef.current) return;
    const cols = (header || []).filter((f) => f.show);
    const rows = tableRef.current.querySelectorAll('tbody tr');
    rows.forEach((tr) => {
      const tds = tr.querySelectorAll(':scope > td');
      // Solo filas de datos (acciones + columnas); se saltan filtros/vacío.
      if (tds.length !== cols.length + 1) return;
      tds.forEach((td, i) => {
        if (i === 0) {
          td.classList.add('crm-actions');
        } else {
          td.setAttribute('data-label', cols[i - 1]?.title || '');
        }
      });
    });
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

      {/* Búsqueda en MÓVIL (la fila de filtros de la tabla se oculta en <640px).
          Colapsable para no ocupar espacio; muestra los mismos filtros. */}
      {searchableCols.length > 0 && (
        <div className="border-b border-gray-100 p-3 sm:hidden">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700"
          >
            <span className="flex items-center gap-2">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              Buscar / filtrar
              {activeFilters > 0 && (
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                  {activeFilters}
                </span>
              )}
            </span>
            <ChevronDownIcon
              className={`h-4 w-4 text-gray-400 transition ${
                mobileFiltersOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          {mobileFiltersOpen && (
            <div className="mt-3 space-y-2.5">
              {searchableCols.map((f) => (
                <div key={f.name}>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">
                    {f.title}
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <SearchFilter
                      name={f.name}
                      title={f.title}
                      value={filters?.[f.name] || ''}
                      showInput={f.showInput}
                      handleFilterChange={handleFilterChange}
                      className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500/15"
                    />
                  </div>
                </div>
              ))}
              {activeFilters > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    searchableCols.forEach((f) =>
                      handleFilterChange(f.name, ''),
                    )
                  }
                  className="text-xs font-medium text-orange-600"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={updateShadow}
          className="overflow-x-auto [scrollbar-width:thin]"
        >
          <table
            ref={tableRef}
            className="crm-table min-w-full text-[13px] text-gray-700 sm:text-sm"
          >
            <Thead header={header} />

            <tbody className="divide-y divide-gray-100">
              {/* Los filtros SIEMPRE montados: si se desmontan al cargar, el
                  calendario de fecha se cierra y pierde la selección. */}
              <InputFilters
                allFilters={header}
                filters={filters}
                handleFilterChange={handleFilterChange}
              />

              {loading ? (
                <TableSkeleton rows={8} cols={header.length + 1} />
              ) : info.length === 0 ? (
                <tr>
                  <td
                    colSpan={header.length + 2}
                    className="px-5 py-14 text-center"
                  >
                    <div className="flex flex-col items-center gap-1 text-gray-400">
                      <InboxIcon className="h-10 w-10 text-gray-300" />
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
