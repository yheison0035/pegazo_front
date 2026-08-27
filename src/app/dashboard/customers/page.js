'use client';

import { useCallback, useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import ViewModal from '../../viewModal';
import Table from '@/components/dashboard/tables/table';
import Pagination from '@/components/dashboard/tables/segments/pagination';
import Button from '@/components/ui/Button';
import RoleGuard from '@/auth/roleGuard';
import { useAuth } from '@/context/authContext';
import { Roles } from '@/config/roles';
import useCustomers from '@/lib/api/hooks/useCustomers';
import useTerms from '@/hooks/useTerms';
import {
  getHeaderTableCustomers,
  viewModalConfig,
} from '@/lib/api/utils/customers.config';
import ConfirmDeleteModal from '@/components/dashboard/tables/segments/confirmDeleteModal';
import AlertModal from '@/components/dashboard/modals/alertModal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import useColumnFilters from '@/components/dashboard/tables/hooks/useColumnFilters';
import { useDebounce } from '@/components/dashboard/tables/hooks/useDebounce';

export default function Customers() {
  const auth = useAuth();
  const usuario = auth?.usuario;
  const t = useTerms();
  const { getCustomers, deleteCustomer, loading } = useCustomers();

  const [customers, setCustomers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alert, setAlert] = useState({});

  const { filters, handleFilterChange } = useColumnFilters({
    type_document: '',
    document: '',
    name: '',
    email: '',
    localId: '',
    phone: '',
    city: '',
    status: '',
    source: '',
  });

  const debouncedFilters = useDebounce(filters, 400);

  const fetchCustomers = useCallback(async () => {
    const res = await getCustomers({
      page,
      limit,
      ...debouncedFilters,
    });

    setCustomers(res.data);
    setMeta(res.meta);
  }, [getCustomers, page, limit, debouncedFilters]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleDeleteClick = (id, name) => {
    setDeleteTarget({ id, name, type: 'este cliente' });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    await deleteCustomer(deleteTarget.id);
    setShowDeleteModal(false);
    setDeleteTarget(null);
    fetchCustomers();
  };

  return (
    <RoleGuard allowedRoles={Object.values(Roles)}>
      <div className="w-full p-4">
        <div className="flex justify-between mb-4">
          <h1 className="text-2xl font-semibold">
            Listado de {t.customerPlural}
          </h1>

          <Button
            variant="add"
            icon={PlusIcon}
            href="/dashboard/customers/new"
          >
            Agregar {t.customer.toLowerCase()}
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow relative">
          <LoadingOverlay show={loading} text="Cargando clientes..." />

          <Table
            header={getHeaderTableCustomers()}
            info={customers}
            view="customers"
            rol={usuario?.role}
            meta={meta}
            limit={limit}
            setPage={setPage}
            setLimit={setLimit}
            loading={loading}
            filters={filters}
            handleFilterChange={handleFilterChange}
            setSelected={setSelectedCustomer}
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

        {selectedCustomer && (
          <ViewModal
            data={selectedCustomer}
            type="customers"
            onClose={() => setSelectedCustomer(null)}
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

        <AlertModal
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({})}
        />
      </div>
    </RoleGuard>
  );
}
