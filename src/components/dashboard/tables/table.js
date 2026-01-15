'use client';

import { useState, useEffect } from 'react';

import Thead from './segments/thead';
import InputFilters from './segments/InputsFilters';
import Pagination from './segments/pagination';
import ContentData from './segments/contentData';
import useTableFilters from './hooks/useTableFilters';

const Table = ({
  header,
  info = [],
  view,
  setSelected,
  setSelectedVariants,
  rol,
  handleDeleteClick,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { filters, filtered, handleFilterChange } = useTableFilters(info, view);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, view]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  const paginatedData = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const getCustomerLockState = (index, customer, data) => {
    if (rol !== 'ASESOR' || view !== 'customers') return false;
    if (customer.comments?.length > 0) return false;

    for (let i = 0; i < index; i++) {
      const prevCustomer = data[i];
      if (!prevCustomer.comments || prevCustomer.comments.length === 0) {
        return true;
      }
    }
    return false;
  };

  return (
    <>
      <table className="min-w-full text-sm text-left text-gray-700">
        <Thead header={header} />

        <tbody>
          <InputFilters
            allFilters={header}
            filters={filters}
            handleFilterChange={handleFilterChange}
          />

          <ContentData
            paginatedData={paginatedData}
            getCustomerLockState={getCustomerLockState}
            rol={rol}
            view={view}
            setSelected={setSelected}
            setSelectedVariants={setSelectedVariants}
            handleDeleteClick={handleDeleteClick}
          />
        </tbody>
      </table>

      <Pagination
        filtered={filtered}
        rowsPerPage={rowsPerPage}
        currentPage={currentPage}
        totalPages={totalPages}
        setRowsPerPage={setRowsPerPage}
        setCurrentPage={setCurrentPage}
      />
    </>
  );
};

export default Table;
