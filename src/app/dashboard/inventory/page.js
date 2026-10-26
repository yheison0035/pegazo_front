'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { exportInventory } from '@/lib/api/routes/inventory';
import useLiveRefresh from '@/hooks/useLiveRefresh';
import {
  beginBackgroundRefresh,
  endBackgroundRefresh,
} from '@/lib/liveRefresh';
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
import ExpiringBanner from '@/components/dashboard/inventory/ExpiringBanner';
import ProductImagesModal from '@/components/dashboard/inventory/productImagesModal';
import useTerms from '@/hooks/useTerms';

export default function Inventory() {
  const auth = useAuth();
  const usuario = auth?.usuario;
  const { getProducts, getProductById, deleteProduct, loading } = useProducts();
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTerms();

  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  // Producto cuyo modal de imágenes está abierto (editar foto desde la lista).
  const [imagesTarget, setImagesTarget] = useState(null);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alert, setAlert] = useState({});
  const [exporting, setExporting] = useState(false);

  // Exporta TODO el inventario a Excel (una fila por variante) con ID y SKU como
  // llave, para editar masivamente y reimportar (y que se ACTUALICE, no duplique).
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportInventory();
      const rows = res?.data || res || [];
      if (!rows.length) {
        setAlert({ type: 'warning', message: 'No hay productos para exportar.' });
        return;
      }
      const data = rows.map((r) => ({
        ID: r.id,
        SKU: r.sku,
        Nombre: r.name,
        Categoría: r.categoryName,
        Marca: r.brandName,
        Proveedor: r.providerName,
        Local: r.localName,
        'Código de barras': r.barcode,
        Color: r.color,
        Talla: r.size,
        'Precio compra': r.purchasePrice,
        'Precio venta': r.salePrice,
        Stock: r.stock,
        'Stock mínimo': r.minStock,
        Unidad: r.unit,
        Estado: r.status,
        Descripción: r.description,
        // Columna vacía: marca SÍ en los productos que ya no vendes y al
        // reimportar se eliminan del inventario (el historial de ventas se
        // conserva). Dejar en blanco = no se toca.
        Eliminar: '',
      }));
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
      XLSX.writeFile(
        wb,
        `inventario-${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
    } catch (e) {
      setAlert({
        type: 'error',
        message: e?.message || 'No se pudo exportar el inventario.',
      });
    } finally {
      setExporting(false);
    }
  };

  const { filters, handleFilterChange } = useColumnFilters({
    name: '',
    barcode: '',
    stock: '',
    localId: '',
    providerId: '',
    categoryId: '',
    salePrice: '',
    status: '',
  });

  const debouncedFilters = useDebounce(filters, 400);

  // Solo la PRIMERA carga muestra el overlay a pantalla completa. Los refetch
  // por filtro/búsqueda/paginación se marcan como refresco en segundo plano:
  // así el overlay (fixed inset-0) NO tapa ni le roba el foco a los inputs de
  // filtro mientras el usuario escribe (antes: al teclear, el overlay aparecía
  // y el buscador "no servía").
  const initialLoad = useRef(true);

  const fetchProducts = useCallback(async () => {
    const background = !initialLoad.current;
    if (background) beginBackgroundRefresh();
    try {
      const res = await getProducts({
        page,
        limit,
        ...debouncedFilters,
      });

      setProducts(res.data);
      setMeta(res.meta);
    } finally {
      initialLoad.current = false;
      if (background) setTimeout(endBackgroundRefresh, 300);
    }
  }, [getProducts, page, limit, debouncedFilters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Deep-link desde el buscador global (⌘K): /dashboard/inventory?open=<id>
  // abre el detalle del producto directamente y limpia el parámetro.
  useEffect(() => {
    const openId = searchParams.get('open');
    if (!openId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getProductById(Number(openId));
        const prod = res?.data || res;
        if (!cancelled && prod) setSelectedProduct(prod);
      } catch {
        /* si no existe, no pasa nada */
      } finally {
        router.replace('/dashboard/inventory');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, getProductById, router]);

  // Sondeo periódico (además del refresco por foco/evento de abajo).
  useLiveRefresh(fetchProducts);

  // Refresco en tiempo real: cuando se aprueba/rechaza una solicitud de stock
  // (mismo o cambio de vista) y al volver el foco a la pestaña, se recarga la
  // lista para reflejar el stock y el estado sin tener que recargar la página.
  useEffect(() => {
    const onChange = () => fetchProducts();
    const onFocus = () => {
      if (document.visibilityState === 'visible') fetchProducts();
    };
    window.addEventListener('stock-requests-changed', onChange);
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onChange);
    return () => {
      window.removeEventListener('stock-requests-changed', onChange);
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onChange);
    };
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold sm:text-2xl">
          Listado de {t.productPlural}
        </h1>
        {can('inventory', 'create') && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600 disabled:opacity-60"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              {exporting ? 'Exportando…' : 'Exportar Excel'}
            </button>
            <Link
              href="/dashboard/inventory/import"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600"
            >
              <ArrowUpTrayIcon className="h-4 w-4" />
              Importar Excel
            </Link>
            <Header type={t.product.toLowerCase()} typeUrl="inventory" />
          </div>
        )}
      </div>

      <ExpiringBanner refreshKey={products} />
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
          onEditImages={setImagesTarget}
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

      {imagesTarget && (
        <ProductImagesModal
          product={imagesTarget}
          onClose={() => setImagesTarget(null)}
          onSaved={fetchProducts}
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
