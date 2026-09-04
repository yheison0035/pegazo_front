'use client';

import { useCallback, useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import ViewModal from '../../viewModal';
import Table from '@/components/dashboard/tables/table';
import Pagination from '@/components/dashboard/tables/segments/pagination';
import Link from 'next/link';
import RoleGuard from '@/auth/roleGuard';
import { useAuth } from '@/context/authContext';
import { Roles, ALL_EXCEPT_BARBER } from '@/config/roles';
import useBrands from '@/lib/api/hooks/useBrands';
import {
  getHeaderTableBrands,
  viewModalConfig,
} from '@/lib/api/utils/brands.config';
import ConfirmDeleteModal from '@/components/dashboard/tables/segments/confirmDeleteModal';
import AlertModal from '@/components/dashboard/modals/alertModal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import useColumnFilters from '@/components/dashboard/tables/hooks/useColumnFilters';
import { useDebounce } from '@/components/dashboard/tables/hooks/useDebounce';
import usePermissions from '@/hooks/usePermissions';
import Header from '@/components/dashboard/customers/header';

export default function Brands() {
  const auth = useAuth();
  const usuario = auth?.usuario;
  const { getBrands, deleteBrand, loading } = useBrands();

  const [brands, setBrands] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [selectedBrand, setSelectedBrand] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alert, setAlert] = useState({});

  const { filters, handleFilterChange } = useColumnFilters({
    name: '',
    description: '',
    status: '',
    localId: '',
  });

  const debouncedFilters = useDebounce(filters, 400);

  const fetchBrands = useCallback(async () => {
    const res = await getBrands({
      page,
      limit,
      ...debouncedFilters,
    });

    setBrands(res.data);
    setMeta(res.meta);
  }, [getBrands, page, limit, debouncedFilters]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const handleDeleteClick = (id, name) => {
    setDeleteTarget({ id, name, type: 'esta marca' });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    await deleteBrand(deleteTarget.id);
    setShowDeleteModal(false);
    setDeleteTarget(null);
    fetchBrands();
  };

  const { can } = usePermissions();

  return (
    <RoleGuard allowedRoles={ALL_EXCEPT_BARBER}>
      <div className="w-full p-4">
        <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
          <h1 className="text-2xl font-semibold">Listado de Marcas</h1>

          {can('brands', 'create') && <Header type="marca" typeUrl="brands" />}
        </div>

        <div className="bg-white rounded-lg shadow relative">
          <LoadingOverlay show={loading} text="Cargando marcas..." />

          <Table
            header={getHeaderTableBrands()}
            info={brands}
            view="brands"
            rol={usuario?.role}
            meta={meta}
            limit={limit}
            setPage={setPage}
            setLimit={setLimit}
            loading={loading}
            filters={filters}
            handleFilterChange={handleFilterChange}
            setSelected={setSelectedBrand}
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

        {selectedBrand && (
          <ViewModal
            data={selectedBrand}
            type="brands"
            onClose={() => setSelectedBrand(null)}
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
