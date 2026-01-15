'use client';

import { useEffect, useState, useCallback } from 'react';
import ViewModal from '../../viewModal';
import Table from '@/components/dashboard/tables/table';
import { useAuth } from '@/context/authContext';
import useDeliveredSales from '@/lib/api/hooks/useDeliveredSales';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { getHeaderTableDeliveredSales } from '@/lib/api/utils/deliveredSales.config';

export default function Delivered_Sales() {
  const [selectedSale, setSelectedSale] = useState(null);
  const [sales, setSales] = useState([]);
  const { usuario } = useAuth();

  const { getDeliveredSales, loading, error } = useDeliveredSales();

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
        />

        {selectedSale && (
          <ViewModal
            data={selectedSale}
            type="delivered_sales"
            onClose={() => setSelectedSale(null)}
          />
        )}
      </div>
    </div>
  );
}
