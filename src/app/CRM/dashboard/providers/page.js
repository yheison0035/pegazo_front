'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/authContext';
import useProviders from '@/lib/api/hooks/useProviders';
import Table from '@/components/dashboard/tables/table';
import Header from '@/components/dashboard/customers/header';
import AlertModal from '@/components/dashboard/modals/alertModal';
import ViewModal from '../../viewModal';
import {
  getHeaderTableProviders,
  viewModalConfig,
} from '@/lib/api/utils/providers.config';
import ConfirmDeleteModal from '@/components/dashboard/tables/segments/confirmDeleteModal';

export default function Providers() {
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providers, setProviders] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { usuario } = useAuth();

  const [alert, setAlert] = useState({ type: '', message: '', url: '' });

  const { getProviders, deleteProvider, loading, error } = useProviders();

  const fetchProviders = useCallback(async () => {
    try {
      const { data } = await getProviders();
      setProviders(data);
    } catch (err) {
      console.error(err);
    }
  }, [getProviders]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleDeleteClick = (id, name) => {
    setDeleteTarget({ id, name, type: 'proveedor' });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteProvider(deleteTarget.id);
      setAlert({
        type: 'success',
        message: 'Proveedor eliminado correctamente.',
      });
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchProviders();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err?.message || 'Error al eliminar proveedor',
      });
    }
  };

  return (
    <div className="w-full p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
          Listado de Proveedores
        </h1>
        <Header type="proveedor" typeUrl="providers" />
      </div>

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        {loading && (
          <p className="text-gray-500 text-sm p-4">Cargando proveedores...</p>
        )}
        {error && <p className="text-red-500 text-sm p-4">{error}</p>}

        <Table
          header={getHeaderTableProviders()}
          info={providers || []}
          view="providers"
          setSelected={setSelectedProvider}
          rol={usuario?.role}
          fetchData={fetchProviders}
          loading={loading}
          error={error}
          handleDeleteClick={handleDeleteClick}
        />

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
