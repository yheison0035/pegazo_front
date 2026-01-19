'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/authContext';
import useExpenses from '@/lib/api/hooks/useExpenses';
import Table from '@/components/dashboard/tables/table';
import Header from '@/components/dashboard/customers/header';
import AlertModal from '@/components/dashboard/modals/alertModal';
import ViewModal from '../../viewModal';
import {
  getHeaderTableExpenses,
  viewModalConfig,
} from '@/lib/api/utils/expenses.config';
import ConfirmDeleteModal from '@/components/dashboard/tables/segments/confirmDeleteModal';

export default function Expenses() {
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { usuario } = useAuth();
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });

  const { getExpenses, deleteExpenses, loading, error } = useExpenses();

  const fetchExpenses = useCallback(async () => {
    try {
      const { data } = await getExpenses();
      setExpenses(data);
    } catch (err) {
      console.error(err);
    }
  }, [getExpenses]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleDeleteClick = (id, name) => {
    setDeleteTarget({ id, name, type: 'este gasto' });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteExpenses(deleteTarget.id);
      setAlert({
        type: 'success',
        message: 'Gasto eliminado correctamente.',
      });
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchExpenses();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err?.message || 'Error al eliminar gasto',
      });
    }
  };

  return (
    <div className="w-full p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
          Listado de Gastos
        </h1>
        <Header type="Gastos" typeUrl="expenses" />
      </div>

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        {loading && (
          <p className="text-gray-500 text-sm p-4">Cargando gastos...</p>
        )}
        {error && <p className="text-red-500 text-sm p-4">{error}</p>}

        <Table
          header={getHeaderTableExpenses()}
          info={expenses || []}
          view="expenses"
          setSelected={setSelectedExpense}
          rol={usuario?.role}
          fetchData={fetchExpenses}
          loading={loading}
          error={error}
          handleDeleteClick={handleDeleteClick}
        />

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
            show={showDeleteModal}
            setShow={setShowDeleteModal}
            type={deleteTarget?.type}
            name={deleteTarget?.name}
            onConfirm={confirmDelete}
            loading={loading}
          />
        )}
      </div>
      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: '', message: '', url: '' })}
        url={alert.url}
      />
    </div>
  );
}
