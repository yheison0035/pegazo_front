'use client';

import { useState, useEffect, useMemo } from 'react';

import Thead from './segments/thead';
import InputFilters from './segments/InputsFilters';
import Pagination from './segments/pagination';
import useCustomers from '@/lib/api/hooks/useProducts';
import AlertModal from '../modals/alertModal';
import ContentData from './segments/contentData';

const Table = ({ header, info = [], view, setSelected, rol, fetchData }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });

  const { deleteCustomer, loading: deleting } = useCustomers();

  const [filters, setFilters] = useState({
    role: '',
    name: '',
    email: '',
    phone: '',
    advisor: '',
    state: '',
    deliveryDate: '',
    plateNumber: '',
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

      const deliveryDateMatch = filters.deliveryDate
        ? a.deliveryDate
            ?.toLowerCase()
            .includes(filters.deliveryDate.toLowerCase())
        : true;

      const plateNumberMatch = filters.plateNumber
        ? a.plateNumber
            ?.toLowerCase()
            .includes(filters.plateNumber.toLowerCase())
        : true;

      if (view === 'customers' || view === 'delivered') {
        const advisorMatch = filters.advisor
          ? (a.advisor?.name?.toLowerCase() || 'sin asignar').includes(
              filters.advisor.toLowerCase()
            )
          : true;

        const stateMatch = filters.state
          ? (a.state?.name?.toLowerCase() || '').includes(
              filters.state.toLowerCase()
            )
          : true;

        return (
          nameMatch &&
          emailMatch &&
          phoneMatch &&
          advisorMatch &&
          stateMatch &&
          deliveryDateMatch &&
          plateNumberMatch
        );
      }

      return roleMatch && nameMatch && emailMatch && phoneMatch;
    });
  }, [info, filters, view]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, view]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeleteClick = (id, name, type) => {
    setDeleteTarget({ id, name, type });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteCustomer(deleteTarget.id);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      setAlert({
        type: 'success',
        message: 'Cliente eliminado correctamente.',
      });
      await fetchData();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err?.message || 'Error al eliminar cliente',
      });
    }
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
            toggleCheckbox={toggleCheckbox}
            selectedIds={selectedIds}
            handleDeleteClick={handleDeleteClick}
            showDeleteModal={showDeleteModal}
            setShowDeleteModal={setShowDeleteModal}
            deleteTarget={deleteTarget}
            confirmDelete={confirmDelete}
            deleting={deleting}
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

      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: '', message: '', url: '' })}
        url={alert.url}
      />
    </>
  );
};

export default Table;
