'use client';

import { useCallback, useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import ViewModal from '../../viewModal';
import Table from '@/components/dashboard/tables/table';
import Link from 'next/link';
import RoleGuard from '@/auth/roleGuard';
import { useAuth } from '@/context/authContext';
import { Roles } from '@/config/roles';
import useLocals from '@/lib/api/hooks/useLocals';
import { getHeaderTableLocals } from '@/lib/api/utils/locals.config';
import ConfirmDeleteModal from '@/components/dashboard/tables/segments/confirmDeleteModal';
import AlertModal from '@/components/dashboard/modals/alertModal';

export default function Locals() {
  const [locals, setLocals] = useState([]);
  const [selectedLocals, setSelectedLocals] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { usuario } = useAuth();
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });

  const { getLocals, deleteLocal, loading, error } = useLocals();

  const fetchLocals = useCallback(async () => {
    try {
      const { data } = await getLocals();
      setLocals(data);
    } catch (err) {
      console.error(err);
    }
  }, [getLocals]);

  useEffect(() => {
    fetchLocals();
  }, [fetchLocals]);

  const handleDeleteClick = (id, name) => {
    setDeleteTarget({ id, name, type: 'local' });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteLocal(deleteTarget.id);
      setAlert({
        type: 'success',
        message: 'Local eliminado correctamente.',
      });
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchLocals();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err?.message || 'Error al eliminar local',
      });
    }
  };

  return (
    <RoleGuard allowedRoles={Object.values(Roles)}>
      <div className="w-full p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
            Listado de Locales
          </h1>

          <div className="flex gap-2">
            <Link
              href="/CRM/dashboard/locals/new"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
            >
              <PlusIcon className="w-4 h-4" />
              Agregar local
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <Table
            header={getHeaderTableLocals()}
            info={locals}
            view="locals"
            setSelected={setSelectedLocals}
            rol={usuario?.role}
            fetchData={fetchLocals}
            loading={loading}
            error={error}
            handleDeleteClick={handleDeleteClick}
          />
          {selectedLocals && (
            <ViewModal
              data={selectedLocals}
              type="locals"
              onClose={() => setSelectedLocals(null)}
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
