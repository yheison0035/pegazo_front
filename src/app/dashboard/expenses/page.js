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
import FixedExpensesPanel from '@/components/dashboard/expenses/FixedExpensesPanel';
import { ArrowsRightLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function Expenses() {
  const auth = useAuth();
  const usuario = auth?.usuario;
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

  // Pestañas: movimientos (lista de gastos) y gastos fijos (recurrentes).
  const [tab, setTab] = useState('movimientos');

  return (
    <div className="w-full p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">
          {tab === 'fijos' ? 'Gastos fijos' : 'Listado de Gastos'}
        </h1>
        {tab === 'movimientos' && can('expenses', 'create') && (
          <Header type="Gastos" typeUrl="expenses" />
        )}
      </div>

      {/* Pestañas */}
      <div className="mb-5 inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
        <button
          type="button"
          onClick={() => setTab('movimientos')}
          className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            tab === 'movimientos'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ArrowsRightLeftIcon className="h-4 w-4" />
          Movimientos
        </button>
        <button
          type="button"
          onClick={() => setTab('fijos')}
          className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            tab === 'fijos'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ArrowPathIcon className="h-4 w-4" />
          Gastos fijos
        </button>
      </div>

      {tab === 'fijos' && <FixedExpensesPanel />}

      <div
        className="bg-white rounded-lg shadow relative"
        hidden={tab !== 'movimientos'}
      >
        <LoadingOverlay show={loading} text="Cargando gastos..." />

        <Table
          header={getHeaderTableExpenses()}
          info={expenses}
          view="expenses"
          rol={usuario?.role}
          meta={meta}
          limit={limit}
          setPage={setPage}
          setLimit={setLimit}
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
