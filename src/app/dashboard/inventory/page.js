'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/authContext';
import useProducts from '@/lib/api/hooks/useProducts';
import Table from '@/components/dashboard/tables/table';
import Pagination from '@/components/dashboard/tables/segments/pagination';
import Header from '@/components/dashboard/customers/header';
import AlertModal from '@/components/dashboard/modals/alertModal';
import ViewModal from '../../viewModal';
import ConfirmDeleteModal from '@/components/dashboard/tables/segments/confirmDeleteModal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import {
  getHeaderTableInventory,
  viewModalConfig,
} from '@/lib/api/utils/inventory.config';
import useColumnFilters from '@/components/dashboard/tables/hooks/useColumnFilters';
import { useDebounce } from '@/components/dashboard/tables/hooks/useDebounce';
import usePermissions from '@/hooks/usePermissions';
import LowStockBanner from '@/components/dashboard/inventory/LowStockBanner';
import useTerms from '@/hooks/useTerms';

export default function Inventory() {
  const auth = useAuth();
  const usuario = auth?.usuario;
  const { getProducts, deleteProduct, loading } = useProducts();
  const t = useTerms();

  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alert, setAlert] = useState({});

  const { filters, handleFilterChange } = useColumnFilters({
    name: '',
    barcode: '',
    localId: '',
    providerId: '',
    salePrice: '',
    status: '',
  });

  const debouncedFilters = useDebounce(filters, 400);

  const fetchProducts = useCallback(async () => {
    const res = await getProducts({
      page,
      limit,
      ...debouncedFilters,
    });

    setProducts(res.data);
    setMeta(res.meta);
  }, [getProducts, page, limit, debouncedFilters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDeleteClick = (id, name) => {
    setDeleteTarget({ id, name });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    await deleteProduct(deleteTarget.id);
    setShowDeleteModal(false);
    setDeleteTarget(null);
    fetchProducts();
  };

  const { can } = usePermissions();

  return (
    <div className="w-full p-4">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-semibold">
          Listado de {t.productPlural}
        </h1>
        {can('inventory', 'create') && (
          <Header type={t.product.toLowerCase()} typeUrl="inventory" />
        )}
      </div>

      <LowStockBanner refreshKey={products} />

      <div className="bg-white rounded-lg shadow relative">
        <LoadingOverlay show={loading} text="Cargando inventario..." />

        <Table
          header={getHeaderTableInventory(usuario)}
          info={products}
          view="inventory"
          rol={usuario?.role}
          meta={meta}
          limit={limit}
          setPage={setPage}
          setLimit={setLimit}
          loading={loading}
          filters={filters}
          handleFilterChange={handleFilterChange}
          setSelected={setSelectedProduct}
          setSelectedVariants={setSelectedVariants}
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

      {selectedProduct && (
        <ViewModal
          data={selectedProduct}
          type="inventory"
          onClose={() => setSelectedProduct(null)}
          viewModalConfig={viewModalConfig(usuario)}
        />
      )}
      {selectedVariants && (
        <ViewModal
          data={selectedVariants}
          type="variants"
          onClose={() => setSelectedVariants(null)}
          view="inventory"
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
