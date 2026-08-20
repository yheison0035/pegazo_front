'use client';

import { useCallback, useEffect, useState } from 'react';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import { useAuth } from '@/context/authContext';
import useTerms from '@/hooks/useTerms';

import Table from '@/components/dashboard/tables/table';
import Pagination from '@/components/dashboard/tables/segments/pagination';
import ViewModal from '../../viewModal';
import ConfirmDeleteModal from '@/components/dashboard/tables/segments/confirmDeleteModal';
import AlertModal from '@/components/dashboard/modals/alertModal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import Header from '@/components/dashboard/customers/header';

import {
  getHeaderTableServices,
  viewModalConfig,
} from '@/lib/api/utils/services.config';

import useColumnFilters from '@/components/dashboard/tables/hooks/useColumnFilters';
import { useDebounce } from '@/components/dashboard/tables/hooks/useDebounce';
import useServices from '@/lib/api/hooks/useServices';
import usePermissions from '@/hooks/usePermissions';

export default function Services() {
  const auth = useAuth();
  const t = useTerms();
  const usuario = auth?.usuario;
  const { getServices, deleteService, loading } = useServices();

  const [services, setServices] = useState([]);
  const [meta, setMeta] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [selectedServices, setSelectedServices] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alert, setAlert] = useState({});
  const [selectedVariants, setSelectedVariants] = useState(null);

  const { filters, handleFilterChange } = useColumnFilters({
    name: '',
    description: '',
    price: '',
    duration: '',
    status: '',
  });

  const debouncedFilters = useDebounce(filters, 400);

  const fetchServices = useCallback(async () => {
    const res = await getServices({
      page,
      limit,
      ...debouncedFilters,
    });

    setServices(res.data);
    setMeta(res.meta);
  }, [getServices, page, limit, debouncedFilters]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleDeleteClick = (id, name) => {
    setDeleteTarget({ id, name, type: 'este servicio' });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    await deleteService(deleteTarget.id);
    setShowDeleteModal(false);
    setDeleteTarget(null);
    fetchServices();
  };

  const { can } = usePermissions();

  return (
    <RoleGuard allowedRoles={Object.values(Roles)}>
      <div className="w-full p-4">
        <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
          <h1 className="text-2xl font-semibold">Listado de {t.servicePlural}</h1>

          {can('services', 'create') && (
            <Header type={t.service.toLowerCase()} typeUrl="services" />
          )}
        </div>

        <div className="bg-white rounded-lg shadow relative">
          <LoadingOverlay show={loading} text="Cargando servicios..." />

          <Table
            header={getHeaderTableServices()}
            info={services}
            view="services"
            rol={usuario?.role}
            meta={meta}
            limit={limit}
            setPage={setPage}
            setLimit={setLimit}
            loading={loading}
            filters={filters}
            handleFilterChange={(name, value) => {
              setPage(1);
              handleFilterChange(name, value);
            }}
            setSelected={setSelectedServices}
            handleDeleteClick={handleDeleteClick}
            setSelectedVariants={setSelectedVariants}
          />

          {meta && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              limit={limit}
              setPage={setPage}
              setLimit={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
            />
          )}
        </div>

        {selectedServices && (
          <ViewModal
            data={selectedServices}
            type="services"
            onClose={() => setSelectedServices(null)}
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

        {selectedVariants && (
          <ViewModal
            data={selectedVariants}
            type="variants"
            onClose={() => setSelectedVariants(null)}
            view="services"
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
