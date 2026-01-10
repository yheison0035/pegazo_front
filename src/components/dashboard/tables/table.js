'use client';

import { useState, useEffect, useMemo } from 'react';

import Thead from './segments/thead';
import InputFilters from './segments/InputsFilters';
import Pagination from './segments/pagination';
import ContentData from './segments/contentData';

const Table = ({
  header,
  info = [],
  view,
  setSelected,
  setSelectedVariants,
  rol,
  handleDeleteClick,
}) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [filters, setFilters] = useState({
    role: '',
    name: '',
    email: '',
    phone: '',
    advisor: '',
    status: '',
    deliveryDate: '',
    description: '',
    userId: '',
    city: '',
    address: '',
    contactName: '',
    productType: '',
    stock: '',
    localId: '',
    providerId: '',
    salePrice: '',
  });

  const filtered = useMemo(() => {
    const arrayInfo = Array.isArray(info) ? info : [];

    return arrayInfo.filter((a) => {
      const roleMatch = filters.role
        ? a.role?.toLowerCase().includes(filters.role.toLowerCase())
        : true;

      const nameMatch = filters.name
        ? a.name?.toLowerCase().includes(filters.name.toLowerCase())
        : true;

      const emailMatch = filters.email
        ? a.email?.toLowerCase().includes(filters.email.toLowerCase())
        : true;

      const phoneMatch = filters.phone
        ? a.phone?.toLowerCase().includes(filters.phone.toLowerCase())
        : true;

      const descriptionMatch = filters.description
        ? a.description
            ?.toLowerCase()
            .includes(filters.description.toLowerCase())
        : true;

      const statusMatch = filters.status
        ? (a.status.toLowerCase() || '').includes(filters.status.toLowerCase())
        : true;

      const userNameMatch = filters.userId
        ? (a.user?.name?.toLowerCase() || '').includes(
            filters.userId.toLowerCase()
          )
        : true;

      const cityMatch = filters.city
        ? (a.city?.toLowerCase() || '').includes(filters.city.toLowerCase())
        : true;

      const addressMatch = filters.address
        ? (a.address?.toLowerCase() || '').includes(
            filters.address.toLowerCase()
          )
        : true;

      const contactNameMatch = filters.contactName
        ? (a.contactName?.toLowerCase() || '').includes(
            filters.contactName.toLowerCase()
          )
        : true;

      const productTypeMatch = filters.productType
        ? (a.productType?.toLowerCase() || '').includes(
            filters.productType.toLowerCase()
          )
        : true;

      const stockMatch = filters.stock
        ? String(a.stock).includes(String(filters.stock))
        : true;

      const localMatch = filters.localId
        ? (a.local?.name?.toLowerCase() || '').includes(
            filters.localId.toLowerCase()
          )
        : true;

      const providerMatch = filters.providerId
        ? (a.provider?.name?.toLowerCase() || '').includes(
            filters.providerId.toLowerCase()
          )
        : true;

      const salePriceMatch = filters.salePrice
        ? String(a.salePrice).includes(String(filters.salePrice))
        : true;

      return (
        roleMatch &&
        nameMatch &&
        emailMatch &&
        phoneMatch &&
        descriptionMatch &&
        statusMatch &&
        userNameMatch &&
        cityMatch &&
        addressMatch &&
        productTypeMatch &&
        contactNameMatch &&
        stockMatch &&
        localMatch &&
        providerMatch &&
        salePriceMatch
      );
    });
  }, [info, filters, view]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, view]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const toggleCheckbox = (row) => {
    setSelectedIds((prev) =>
      prev.includes(row.id)
        ? prev.filter((id) => id !== row.id)
        : [...prev, row.id]
    );
  };

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
            toggleCheckbox={toggleCheckbox}
            selectedIds={selectedIds}
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
