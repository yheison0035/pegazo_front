'use client';

import { useEffect, useState, useCallback } from 'react';
import Table from '@/components/dashboard/tables/table';
import { useAuth } from '@/context/authContext';
import useDeliveredSales from '@/lib/api/hooks/useDeliveredSales';
import {
  getHeaderTableDeliveredSales,
  viewModalConfig,
} from '@/lib/api/utils/deliveredSales.config';
import ConfirmDeleteModal from '@/components/dashboard/tables/segments/confirmDeleteModal';
import AlertModal from '@/components/dashboard/modals/alertModal';
import ViewModal from '../../viewModal';
import { printSaleInvoice } from '@/utils/printInvoice';

export default function Delivered_Sales() {
  const [selectedSale, setSelectedSale] = useState(null);
  const [sales, setSales] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { usuario } = useAuth();
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });

  const { getDeliveredSales, deleteDeliveredSale, loading, error } =
    useDeliveredSales();

  const fetchData = useCallback(async () => {
    try {
      const { data } = await getDeliveredSales();
      setSales(data || []);
    } catch (err) {
      console.error(err);
    }
  }, [getDeliveredSales]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteClick = (id, name) => {
    console.log(name);
    setDeleteTarget({ id, name, type: 'esta venta' });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteDeliveredSale(deleteTarget.id);
      setAlert({
        type: 'success',
        message: 'Venta eliminada correctamente.',
      });
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchData();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err?.message || 'Error al eliminar venta',
      });
    }
  };

  const setPrinterInvoice = (sale) => {
    printSaleInvoice(sale);
  };

  return (
    <div className="w-full p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
          Listado de Ventas Realizadas
        </h1>
      </div>

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        {loading && (
          <p className="text-gray-500 text-sm p-4">
            Cargando ventas realizadas...
          </p>
        )}
        {error && <p className="text-red-500 text-sm p-4">{error}</p>}

        <Table
          header={getHeaderTableDeliveredSales()}
          info={sales}
          view="delivered_sales"
          setSelected={setSelectedSale}
          rol={usuario?.role}
          fetchData={fetchData}
          loading={loading}
          error={error}
          handleDeleteClick={handleDeleteClick}
          setPrinterInvoice={setPrinterInvoice}
        />

        {selectedSale && (
          <ViewModal
            data={selectedSale}
            type="delivered_sales"
            onClose={() => setSelectedSale(null)}
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
