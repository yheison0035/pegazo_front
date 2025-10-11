'use client';

import { useState, useEffect } from 'react';

import Thead from './segments/thead';
import InputFilters from './segments/InputsFilters';
import ModalAdvisor from './segments/modalAdvisor';
import Pagination from './segments/pagination';
import ChangeAdvisorModal from '../modals/changeAdvisorModal';
import useCustomers from '@/lib/api/hooks/useCustomers';
import AlertModal from '../modals/alertModal';
import useUsers from '@/lib/api/hooks/useUsers';
import AssignAdvisor from './segments/assignAdvisor';
import ContentData from './segments/contentData';
import usePermissions from '@/hooks/usePermissions';

const Table = ({ info = [], view, setSelected, rol, fetchData }) => {
  const [filtered, setFiltered] = useState(info);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedAdvisor, setSelectedAdvisor] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showModalChangeAdvisor, setShowModalChangeAdvisor] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });
  const [advisors, setAdvisors] = useState([]);

  const { getUsers } = useUsers();
  const { assignMultipleCustomers, loading, assignAdvisor } = useCustomers();
  const { deleteCustomer, loading: deleting, error } = useCustomers();

  const { canViewAll, canCreate } = usePermissions();

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

  useEffect(() => {
    const arrayInfo = Array.isArray(info) ? info : [];
    let result = arrayInfo.filter((a) => {
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

    setFiltered(result);
    setCurrentPage(1);
  }, [filters, info, view]);

  useEffect(() => {
    canViewAll && canCreate && fetchAdvisors();
  }, []);

  const fetchAdvisors = async () => {
    try {
      const { data } = await getUsers();
      setAdvisors(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeleteClick = (id, name, type) => {
    setDeleteTarget({ id, name, type });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      try {
        await deleteCustomer(deleteTarget.id);
        setShowDeleteModal(false);
        setDeleteTarget(null);
        setAlert({
          type: 'success',
          message: `Cliente eliminado correctamente.`,
        });
        await fetchData();
      } catch (err) {
        setAlert({
          type: 'error',
          message: err.message || 'Error al eliminar cliente',
        });
      }
    }
  };

  const toggleCheckbox = (info) => {
    setSelectedIds((prev) =>
      prev.includes(info.id)
        ? prev.filter((id) => id !== info.id)
        : [...prev, info.id]
    );
  };

  const handleAssignMultiple = async () => {
    if (!selectedAdvisor || selectedIds.length === 0) return;
    try {
      await assignMultipleCustomers(selectedIds, selectedAdvisor);
      setAlert({
        type: 'success',
        message: `Se asignaron ${selectedIds.length} clientes al asesor.`,
      });
      setSelectedIds([]);
      setSelectedAdvisor('');
      setShowModal(false);
      await fetchData();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al asignar clientes',
      });
    }
  };

  const getCustomerLockState = (index, customer) => {
    if (rol !== 'ASESOR' || view !== 'customers') return false;
    if (customer.comments?.length > 0) return false;

    for (let i = 0; i < index; i++) {
      const prevCustomer = paginatedData[i];
      if (!prevCustomer.comments || prevCustomer.comments.length === 0) {
        return true;
      }
    }
    return false;
  };

  const handleAssignAdvisor = async (customerId, newAdvisorId) => {
    try {
      await assignAdvisor(Number(customerId), Number(newAdvisorId));

      setAlert({
        type: 'success',
        message: `Cliente reasignado correctamente al nuevo asesor.`,
      });
      await fetchData();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al reasignar asesor',
      });
    } finally {
      setShowModalChangeAdvisor(null);
    }
  };

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginatedData = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <>
      <AssignAdvisor
        rol={rol}
        view={view}
        selectedIds={selectedIds}
        setShowModal={setShowModal}
      />
      <table className="min-w-full text-sm text-left text-gray-700">
        <Thead rol={rol} view={view} />

        <tbody>
          <InputFilters
            rol={rol}
            view={view}
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
            setShowModalChangeAdvisor={setShowModalChangeAdvisor}
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

      {showModal && (
        <ModalAdvisor
          selectedAdvisor={selectedAdvisor}
          setShowModal={setShowModal}
          setSelectedAdvisor={setSelectedAdvisor}
          handleAssignMultiple={handleAssignMultiple}
          loading={loading}
          advisors={advisors}
        />
      )}

      {showModalChangeAdvisor && (
        <ChangeAdvisorModal
          isOpen={!!showModalChangeAdvisor}
          onClose={() => setShowModalChangeAdvisor(null)}
          onSave={(newAdvisorId) =>
            handleAssignAdvisor(showModalChangeAdvisor.id, newAdvisorId)
          }
          currentAdvisor={showModalChangeAdvisor.advisor?.name || 'Sin Asignar'}
          advisors={advisors}
          loading={loading}
        />
      )}
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
