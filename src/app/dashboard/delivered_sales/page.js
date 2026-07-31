'use client';

import { useEffect, useState, useCallback } from 'react';
import Table from '@/components/dashboard/tables/table';
import Pagination from '@/components/dashboard/tables/segments/pagination';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useAuth } from '@/context/authContext';
import {
  Squares2X2Icon,
  CalendarDaysIcon,
  CalendarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/solid';
import useDeliveredSales from '@/lib/api/hooks/useDeliveredSales';
import {
  getHeaderTableDeliveredSales,
  viewModalConfig,
} from '@/lib/api/utils/deliveredSales.config';
import ConfirmDeleteModal from '@/components/dashboard/tables/segments/confirmDeleteModal';
import AlertModal from '@/components/dashboard/modals/alertModal';
import ViewModal from '../../viewModal';
import { printSaleInvoice } from '@/utils/printInvoice';
import DailySalesReportModal from '@/components/dashboard/modals/dailySalesReportModal';
import SalesRangeReModal from '@/components/dashboard/modals/salesRangeReModal';
import useColumnFilters from '@/components/dashboard/tables/hooks/useColumnFilters';
import { useDebounce } from '@/components/dashboard/tables/hooks/useDebounce';
import SalesRangeGeneralModal from '@/components/dashboard/modals/salesRangeGeneralModal';
import ServicePerformanceModal from '@/components/dashboard/modals/servicePerformanceModal';

export default function Delivered_Sales() {
  const auth = useAuth();
  const usuario = auth?.usuario;
  const { getDeliveredSales, deleteDeliveredSale, loading } =
    useDeliveredSales();

  const [sales, setSales] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [selectedSale, setSelectedSale] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [showRangeReport, setShowRangeReport] = useState(false);
  const [showGeneralReport, setShowGeneralReport] = useState(false);
  const [showServiceReport, setShowServiceReport] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alert, setAlert] = useState({});

  const { filters, handleFilterChange } = useColumnFilters({
    code: '',
    customer: '',
    totalAmount: '',
    paymentMethod: '',
    localId: '',
    userId: '',
    paymentStatus: '',
    saleDate: '',
  });

  const debouncedFilters = useDebounce(filters, 400);

  const fetchSales = useCallback(async () => {
    const res = await getDeliveredSales({
      page,
      limit,
      ...debouncedFilters,
    });

    setSales(res.data);
    setMeta(res.meta);
  }, [getDeliveredSales, page, limit, debouncedFilters]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleDeleteClick = (id, name) => {
    setDeleteTarget({ id, name, type: 'esta venta' });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    await deleteDeliveredSale(deleteTarget.id);
    setShowDeleteModal(false);
    setDeleteTarget(null);
    fetchSales();
  };

  const setPrinterInvoice = (sale) => {
    printSaleInvoice(sale, usuario);
  };

  return (
    <div className="w-full p-4">
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <h1 className="text-2xl font-semibold">Listado de Ventas Realizadas</h1>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          {usuario?.company?.type === 'SERVICIOS' && (
            <button
              onClick={() => setShowServiceReport(true)}
              className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition w-full sm:w-auto cursor-pointer"
            >
              <Squares2X2Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="whitespace-nowrap">Ventas y Servicios</span>
            </button>
          )}
          {usuario?.company?.type !== 'SERVICIOS' && (
            <>
              <button
                onClick={() => setShowDailyReport(true)}
                className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition w-full sm:w-auto cursor-pointer"
              >
                <CalendarDaysIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="whitespace-nowrap">Venta por Día</span>
              </button>

              <button
                onClick={() => setShowRangeReport(true)}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition w-full sm:w-auto cursor-pointer"
              >
                <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="whitespace-nowrap">Venta por Semana</span>
              </button>

              <button
                onClick={() => setShowGeneralReport(true)}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition w-full sm:w-auto cursor-pointer"
              >
                <ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="whitespace-nowrap">Ventas Generales</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow relative">
        <LoadingOverlay show={loading} text="Cargando ventas o servicios..." />

        <Table
          header={getHeaderTableDeliveredSales()}
          info={sales}
          view="delivered_sales"
          rol={usuario?.role}
          meta={meta}
          limit={limit}
          setPage={setPage}
          setLimit={setLimit}
          loading={loading}
          filters={filters}
          handleFilterChange={handleFilterChange}
          setSelected={setSelectedSale}
          handleDeleteClick={handleDeleteClick}
          setPrinterInvoice={setPrinterInvoice}
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

      {showServiceReport && (
        <ServicePerformanceModal onClose={() => setShowServiceReport(false)} />
      )}

      {showDailyReport && (
        <DailySalesReportModal onClose={() => setShowDailyReport(false)} />
      )}

      {showRangeReport && (
        <SalesRangeReModal onClose={() => setShowRangeReport(false)} />
      )}

      {showGeneralReport && (
        <SalesRangeGeneralModal onClose={() => setShowGeneralReport(false)} />
      )}

      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({})}
      />
    </div>
  );
}
