'use client';

import { useCallback, useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import ViewModal from '../../viewModal';
import Table from '@/components/dashboard/tables/table';
import Link from 'next/link';
import RoleGuard from '@/auth/roleGuard';
import { useAuth } from '@/context/authContext';
import { Roles } from '@/config/roles';
import useCustomers from '@/lib/api/hooks/useCustomers';
import {
  getHeaderTableCustomers,
  viewModalConfig,
} from '@/lib/api/utils/customers.config';
import ConfirmDeleteModal from '@/components/dashboard/tables/segments/confirmDeleteModal';
import AlertModal from '@/components/dashboard/modals/alertModal';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { usuario } = useAuth();
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });

  const { getCustomers, deleteCustomer, loading, error } = useCustomers();

  const fetchCustomers = useCallback(async () => {
    try {
      const { data } = await getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    }
  }, [getCustomers]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleDeleteClick = (id, name) => {
    setDeleteTarget({ id, name, type: 'cliente' });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteCustomer(deleteTarget.id);
      setAlert({
        type: 'success',
        message: 'Cliente eliminado correctamente.',
      });
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchCustomers();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err?.message || 'Error al eliminar cliente',
      });
    }
  };

  return (
    <RoleGuard allowedRoles={Object.values(Roles)}>
      <div className="w-full p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
            Listado de Clientes
          </h1>

          <div className="flex gap-2">
            <Link
              href="/CRM/dashboard/customers/new"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
            >
              <PlusIcon className="w-4 h-4" />
              Agregar cliente
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <Table
            header={getHeaderTableCustomers()}
            info={customers}
            view="customers"
            setSelected={setSelectedCustomers}
            rol={usuario?.role}
            fetchData={fetchCustomers}
            loading={loading}
            error={error}
            handleDeleteClick={handleDeleteClick}
          />
          {selectedCustomers && (
            <ViewModal
              data={selectedCustomers}
              type="customers"
              onClose={() => setSelectedCustomers(null)}
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
    </RoleGuard>
  );
}
