'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/authContext';
import useExpenses from '@/lib/api/hooks/useExpenses';
import Table from '@/components/dashboard/tables/table';
import Pagination from '@/components/dashboard/tables/segments/pagination';
import Header from '@/components/dashboard/customers/header';
import AlertModal from '@/components/dashboard/modals/alertModal';
import ViewModal from '../../viewModal';
import ConfirmDeleteModal from '@/components/dashboard/tables/segments/confirmDeleteModal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import useColumnFilters from '@/components/dashboard/tables/hooks/useColumnFilters';
import { useDebounce } from '@/components/dashboard/tables/hooks/useDebounce';
import {
  getHeaderTableExpenses,
  viewModalConfig,
} from '@/lib/api/utils/expenses.config';
import usePermissions from '@/hooks/usePermissions';

export default function Expenses() {
  const { usuario } = useAuth();
  const { getExpenses, deleteExpenses, loading } = useExpenses();

  const [expenses, setExpenses] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alert, setAlert] = useState({});

  const { filters, handleFilterChange } = useColumnFilters({
    concept: '',
    type: '',
    amount: '',
    paymentMethod: '',
    paidTo: '',
    localId: '',
    providerId: '',
    expenseDate: '',
    status: '',
  });

  const debouncedFilters = useDebounce(filters, 400);

  const fetchExpenses = useCallback(async () => {
    const res = await getExpenses({
      page,
      limit,
      ...debouncedFilters,
    });

    setExpenses(res.data);
    setMeta(res.meta);
  }, [getExpenses, page, limit, debouncedFilters]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleDeleteClick = (id, name) => {
    setDeleteTarget({ id, name, type: 'este gasto' });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    await deleteExpenses(deleteTarget.id);
    setShowDeleteModal(false);
    setDeleteTarget(null);
    fetchExpenses();
  };

  const { can } = usePermissions();

  return (
    <div className="w-full p-4">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-semibold">Listado de Gastos</h1>
        {can('expenses', 'create') && (
          <Header type="Gastos" typeUrl="expenses" />
        )}
      </div>

      <div className="bg-white rounded-lg shadow relative">
        <LoadingOverlay show={loading} text="Cargando gastos..." />

        <Table
          header={getHeaderTableExpenses()}
          info={expenses}
          view="expenses"
          rol={usuario?.role}
          loading={loading}
          filters={filters}
          handleFilterChange={handleFilterChange}
          setSelected={setSelectedExpense}
          handleDeleteClick={handleDeleteClick}
        />

        {meta && (
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            limit={limit}
            setPage={setPage}
            setLimit={setLimit}
          />
        )}
      </div>

      {selectedExpense && (
        <ViewModal
          data={selectedExpense}
          type="expenses"
          onClose={() => setSelectedExpense(null)}
          viewModalConfig={viewModalConfig}
        />
      )}

      {showDeleteModal && (
        <ConfirmDeleteModal
          show
          setShow={setShowDeleteModal}
          type={deleteTarget?.type}
          name={deleteTarget?.name}
          onConfirm={confirmDelete}
          loading={loading}
        />
      )}

      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({})}
      />
    </div>
  );
}
