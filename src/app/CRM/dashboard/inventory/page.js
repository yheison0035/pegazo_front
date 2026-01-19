'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/authContext';
import useProducts from '@/lib/api/hooks/useProducts';
import Table from '@/components/dashboard/tables/table';
import Header from '@/components/dashboard/customers/header';
import AlertModal from '@/components/dashboard/modals/alertModal';
import ViewModal from '../../viewModal';
import {
  getHeaderTableInventory,
  viewModalConfig,
} from '@/lib/api/utils/inventory.config';
import ConfirmDeleteModal from '@/components/dashboard/tables/segments/confirmDeleteModal';

export default function Inventory() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState(null);
  const [products, setProducts] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });
  const { usuario } = useAuth();

  const { getProducts, deleteProduct, loading, error } = useProducts();

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  }, [getProducts]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDeleteClick = (id, name) => {
    setDeleteTarget({ id, name, type: 'este producto' });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteProduct(deleteTarget.id);
      setAlert({
        type: 'success',
        message: 'Producto eliminado correctamente.',
      });
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchProducts();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err?.message || 'Error al eliminar producto',
      });
    }
  };

  return (
    <div className="w-full p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
          Listado de Inventario
        </h1>
        <Header type="producto" typeUrl="inventory" />
      </div>

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        {loading && (
          <p className="text-gray-500 text-sm p-4">Cargando inventario...</p>
        )}
        {error && <p className="text-red-500 text-sm p-4">{error}</p>}

        <Table
          header={getHeaderTableInventory()}
          info={products || []}
          view="inventory"
          setSelected={setSelectedProduct}
          rol={usuario?.role}
          fetchData={fetchProducts}
          loading={loading}
          error={error}
          setSelectedVariants={setSelectedVariants}
          handleDeleteClick={handleDeleteClick}
        />

        {selectedProduct && (
          <ViewModal
            data={selectedProduct}
            type="inventory"
            onClose={() => setSelectedProduct(null)}
            viewModalConfig={viewModalConfig}
          />
        )}
        {selectedVariants && (
          <ViewModal
            data={selectedVariants}
            type="variants"
            onClose={() => setSelectedVariants(null)}
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
