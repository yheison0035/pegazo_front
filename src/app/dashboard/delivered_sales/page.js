'use client';

import { useEffect, useState, useCallback } from 'react';
import Table from '@/components/dashboard/tables/table';
import Pagination from '@/components/dashboard/tables/segments/pagination';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/authContext';
import {
  Squares2X2Icon,
  CalendarDaysIcon,
  CalendarIcon,
  ChartBarIcon,
  UserPlusIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import ReactivateCustomersModal from '@/components/appointments/ReactivateCustomersModal';
import { isServicesBusiness } from '@/lib/appointmentsAccess';
import { downloadCsv } from '@/utils/exportCsv';
import { formatCOP, formatDateSafe } from '@/lib/api/utils/utils';
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
  const isServices = isServicesBusiness(usuario);

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
  const [showReactivate, setShowReactivate] = useState(false);
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

  const [exporting, setExporting] = useState(false);
  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await getDeliveredSales({
        page: 1,
        limit: 5000,
        ...debouncedFilters,
      });
      const rows = (res.data || []).map((s) => ({
        Fecha: formatDateSafe(s.saleDate),
        Codigo: s.code,
        Cliente: s.customer?.name || 'Consumidor final',
        Total: s.totalAmount,
        Metodo: s.paymentMethod,
        Estado: s.paymentStatus,
        Local: s.local?.name || '',
        Vendedor: s.user?.name || '',
      }));
      downloadCsv(
        `ventas_${new Date().toISOString().slice(0, 10)}.csv`,
        rows
      );
    } finally {
      setExporting(false);
    }
  };

  const setPrinterInvoice = (sale) => {
    printSaleInvoice(sale, usuario);
  };

  return (
    <div className="w-full p-4">
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <h1 className="text-2xl font-semibold">Listado de Ventas Realizadas</h1>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          {isServices ? (
            <Button
              variant="info"
              icon={Squares2X2Icon}
              onClick={() => setShowServiceReport(true)}
              className="w-full sm:w-auto"
            >
              Ventas y Servicios
            </Button>
          ) : (
            <>
              <Button
                variant="info"
                icon={CalendarDaysIcon}
                onClick={() => setShowDailyReport(true)}
                className="w-full sm:w-auto"
              >
                Venta por Día
              </Button>

              <Button
                variant="info"
                icon={CalendarIcon}
                onClick={() => setShowRangeReport(true)}
                className="w-full sm:w-auto"
              >
                Venta por Semana
              </Button>

              <Button
                variant="info"
                icon={ChartBarIcon}
                onClick={() => setShowGeneralReport(true)}
                className="w-full sm:w-auto"
              >
                Ventas Generales
              </Button>
            </>
          )}

          {/* Reactivar clientes: útil para cualquier negocio con clientes. */}
          <Button
            variant="add"
            icon={UserPlusIcon}
            onClick={() => setShowReactivate(true)}
            className="w-full sm:w-auto"
          >
            Reactivar clientes
          </Button>

          <Button
            variant="secondary"
            icon={ArrowDownTrayIcon}
            onClick={exportCsv}
            loading={exporting}
            className="w-full sm:w-auto"
          >
            Exportar CSV
          </Button>
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

      {showReactivate && (
        <ReactivateCustomersModal onClose={() => setShowReactivate(false)} />
      )}

      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({})}
      />
    </div>
  );
}
