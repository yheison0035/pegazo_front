'use client';

import { useCallback, useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import { useAuth } from '@/context/authContext';

import useLocals from '@/lib/api/hooks/useLocals';

import Table from '@/components/dashboard/tables/table';
import Pagination from '@/components/dashboard/tables/segments/pagination';
import ViewModal from '../../viewModal';
import ConfirmDeleteModal from '@/components/dashboard/tables/segments/confirmDeleteModal';
import AlertModal from '@/components/dashboard/modals/alertModal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

import {
  getHeaderTableLocals,
  viewModalConfig,
} from '@/lib/api/utils/locals.config';

import useColumnFilters from '@/components/dashboard/tables/hooks/useColumnFilters';
import { useDebounce } from '@/components/dashboard/tables/hooks/useDebounce';

export default function Appointments() {
  const { usuario } = useAuth();
  const { getLocals, deleteLocal, loading } = useLocals();

  const [locals, setLocals] = useState([]);
  const [meta, setMeta] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [selectedLocals, setSelectedLocals] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alert, setAlert] = useState({});

  const { filters, handleFilterChange } = useColumnFilters({
    name: '',
    address: '',
    city: '',
    managerId: '',
    phone: '',
    status: '',
  });

  const debouncedFilters = useDebounce(filters, 400);

  const fetchLocals = useCallback(async () => {
    const res = await getLocals({
      page,
      limit,
      ...debouncedFilters,
    });

    setLocals(res.data);
    setMeta(res.meta);
  }, [getLocals, page, limit, debouncedFilters]);

  useEffect(() => {
    fetchLocals();
  }, [fetchLocals]);

  const handleDeleteClick = (id, name) => {
    setDeleteTarget({ id, name, type: 'este local' });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    await deleteLocal(deleteTarget.id);
    setShowDeleteModal(false);
    setDeleteTarget(null);
    fetchLocals();
  };

  return (
    <RoleGuard allowedRoles={Object.values(Roles)}>
      <div className="w-full p-4">
        <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
          <h1 className="text-2xl font-semibold">Listado de Locales</h1>

          <Link
            href="/CRM/dashboard/locals/new"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            <PlusIcon className="w-4 h-4" />
            Agregar local
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow relative">
          <LoadingOverlay show={loading} text="Cargando locales..." />

          <Table
            header={getHeaderTableLocals()}
            info={locals}
            view="locals"
            rol={usuario?.role}
            loading={loading}
            filters={filters}
            handleFilterChange={(name, value) => {
              setPage(1);
              handleFilterChange(name, value);
            }}
            setSelected={setSelectedLocals}
            handleDeleteClick={handleDeleteClick}
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

        {selectedLocals && (
          <ViewModal
            data={selectedLocals}
            type="locals"
            onClose={() => setSelectedLocals(null)}
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
