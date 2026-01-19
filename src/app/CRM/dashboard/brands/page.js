'use client';

import { useCallback, useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import ViewModal from '../../viewModal';
import Table from '@/components/dashboard/tables/table';
import Link from 'next/link';
import RoleGuard from '@/auth/roleGuard';
import { useAuth } from '@/context/authContext';
import { Roles } from '@/config/roles';
import useBrands from '@/lib/api/hooks/useBrands';
import {
  getHeaderTableBrands,
  viewModalConfig,
} from '@/lib/api/utils/brands.config';
import ConfirmDeleteModal from '@/components/dashboard/tables/segments/confirmDeleteModal';
import AlertModal from '@/components/dashboard/modals/alertModal';

export default function Brands() {
  const [brands, setBrands] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { usuario } = useAuth();
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });

  const { getBrands, deleteBrand, loading, error } = useBrands();

  const fetchBrands = useCallback(async () => {
    try {
      const { data } = await getBrands();
      setBrands(data);
    } catch (err) {
      console.error(err);
    }
  }, [getBrands]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const handleDeleteClick = (id, name) => {
    setDeleteTarget({ id, name, type: 'esta marca' });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteBrand(deleteTarget.id);
      setAlert({
        type: 'success',
        message: 'Marca eliminada correctamente.',
      });
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchBrands();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err?.message || 'Error al eliminar marca',
      });
    }
  };

  return (
    <RoleGuard allowedRoles={Object.values(Roles)}>
      <div className="w-full p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
            Listado de Marcas
          </h1>

          <div className="flex gap-2">
            <Link
              href="/CRM/dashboard/brands/new"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
            >
              <PlusIcon className="w-4 h-4" />
              Agregar marca
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <Table
            header={getHeaderTableBrands()}
            info={brands}
            view="brands"
            setSelected={setSelectedBrands}
            rol={usuario?.role}
            fetchData={fetchBrands}
            loading={loading}
            error={error}
            handleDeleteClick={handleDeleteClick}
          />
          {selectedBrands && (
            <ViewModal
              data={selectedBrands}
              type="brands"
              onClose={() => setSelectedBrands(null)}
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
