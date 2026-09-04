'use client';

import { useCallback, useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import ViewModal from '../../viewModal';
import Table from '@/components/dashboard/tables/table';
import Pagination from '@/components/dashboard/tables/segments/pagination';
import Button from '@/components/ui/Button';
import RoleGuard from '@/auth/roleGuard';
import { useAuth } from '@/context/authContext';
import { Roles, ALL_EXCEPT_BARBER } from '@/config/roles';
import useUsers from '@/lib/api/hooks/useUsers';
import {
  getHeaderTableUsers,
  viewModalConfig,
} from '@/lib/api/utils/users.config';
import ConfirmDeleteModal from '@/components/dashboard/tables/segments/confirmDeleteModal';
import AlertModal from '@/components/dashboard/modals/alertModal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import useColumnFilters from '@/components/dashboard/tables/hooks/useColumnFilters';
import { useDebounce } from '@/components/dashboard/tables/hooks/useDebounce';

export default function Users() {
  const auth = useAuth();
  const usuario = auth?.usuario;
  const { getUsers, deleteUser, loading } = useUsers();

  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alert, setAlert] = useState({});

  const { filters, handleFilterChange } = useColumnFilters({
    role: '',
    name: '',
    managedLocals: '',
    localId: '',
    document: '',
    email: '',
    phone: '',
    address: '',
    status: '',
  });

  const debouncedFilters = useDebounce(filters, 400);

  const fetchUsers = useCallback(async () => {
    const res = await getUsers({
      page,
      limit,
      ...debouncedFilters,
    });

    setUsers(res.data);
    setMeta(res.meta);
  }, [getUsers, page, limit, debouncedFilters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteClick = (id, name) => {
    setDeleteTarget({ id, name, type: 'este usuario' });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    await deleteUser(deleteTarget.id);
    setShowDeleteModal(false);
    setDeleteTarget(null);
    fetchUsers();
  };

  return (
    <RoleGuard allowedRoles={ALL_EXCEPT_BARBER}>
      <div className="w-full p-4">
        <div className="flex justify-between mb-4">
          <h1 className="text-2xl font-semibold">Listado de Usuarios</h1>

          <Button variant="add" icon={PlusIcon} href="/dashboard/users/new">
            Agregar usuario
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow relative">
          <LoadingOverlay show={loading} text="Cargando usuarios..." />

          <Table
            header={getHeaderTableUsers()}
            info={users}
            view="users"
            rol={usuario?.role}
            meta={meta}
            limit={limit}
            setPage={setPage}
            setLimit={setLimit}
            loading={loading}
            filters={filters}
            handleFilterChange={handleFilterChange}
            setSelected={setSelectedUser}
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

        {selectedUser && (
          <ViewModal
            data={selectedUser}
            type="user"
            onClose={() => setSelectedUser(null)}
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
