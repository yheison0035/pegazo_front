'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/authContext';
import useProviders from '@/lib/api/hooks/useProviders';
import Table from '@/components/dashboard/tables/table';
import Pagination from '@/components/dashboard/tables/segments/pagination';
import Header from '@/components/dashboard/customers/header';
import AlertModal from '@/components/dashboard/modals/alertModal';
import ViewModal from '../../viewModal';
import ConfirmDeleteModal from '@/components/dashboard/tables/segments/confirmDeleteModal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import {
  getHeaderTableProviders,
  viewModalConfig,
} from '@/lib/api/utils/providers.config';
import useColumnFilters from '@/components/dashboard/tables/hooks/useColumnFilters';
import { useDebounce } from '@/components/dashboard/tables/hooks/useDebounce';
import usePermissions from '@/hooks/usePermissions';

export default function Providers() {
  const auth = useAuth();
  const usuario = auth?.usuario;
  const { getProviders, deleteProvider, loading } = useProviders();

  const [providers, setProviders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alert, setAlert] = useState({});

  const { filters, handleFilterChange } = useColumnFilters({
    name: '',
    contactName: '',
    productType: '',
    address: '',
    city: '',
    phone: '',
    status: '',
  });

  const debouncedFilters = useDebounce(filters, 400);

  const fetchProviders = useCallback(async () => {
    const res = await getProviders({
      page,
      limit,
      ...debouncedFilters,
    });

    setProviders(res.data);
    setMeta(res.meta);
  }, [getProviders, page, limit, debouncedFilters]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleDeleteClick = (id, name) => {
    setDeleteTarget({ id, name, type: 'este proveedor' });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    await deleteProvider(deleteTarget.id);
    setShowDeleteModal(false);
    setDeleteTarget(null);
    fetchProviders();
  };

  const { can } = usePermissions();

  return (
    <div className="w-full p-4">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-semibold">Listado de Proveedores</h1>
        {can('providers', 'create') && (
          <Header type="proveedor" typeUrl="providers" />
        )}
      </div>

      <div className="bg-white rounded-lg shadow relative">
        <LoadingOverlay show={loading} text="Cargando proveedores..." />

        <Table
          header={getHeaderTableProviders()}
          info={providers}
          view="providers"
          rol={usuario?.role}
          meta={meta}
          limit={limit}
          setPage={setPage}
          setLimit={setLimit}
          loading={loading}
          filters={filters}
          handleFilterChange={handleFilterChange}
          setSelected={setSelectedProvider}
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

      {selectedProvider && (
        <ViewModal
          data={selectedProvider}
          type="provider"
          onClose={() => setSelectedProvider(null)}
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
  );
}
