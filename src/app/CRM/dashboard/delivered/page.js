'use client';

import { useEffect, useState, useCallback } from 'react';
import ViewModal from '../../viewModal';
import Table from '@/components/dashboard/tables/table';
import { useAuth } from '@/context/authContext';
import useCustomers from '@/lib/api/hooks/useCustomers';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import usePermissions from '@/hooks/usePermissions';

export default function Delivered() {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const { usuario } = useAuth();

  const { getDeliveredCustomers, exportDeliveredCustomers, loading, error } =
    useCustomers();

  const { canExport } = usePermissions();

  const fetchData = useCallback(async () => {
    try {
      const { data } = await getDeliveredCustomers();
      setCustomers(data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async () => {
    try {
      await exportDeliveredCustomers();
    } catch (err) {
      alert(err.message || 'Error exportando clientes');
    }
  };

  return (
    <div className="w-full p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
          Listado de Clientes Entregados
        </h1>

        {canExport && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition cursor-pointer"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Exportar Excel
          </button>
        )}
      </div>

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        {loading && (
          <p className="text-gray-500 text-sm p-4">
            Cargando clientes entregados...
          </p>
        )}
        {error && <p className="text-red-500 text-sm p-4">{error}</p>}

        <Table
          info={customers}
          view="delivered"
          setSelected={setSelectedCustomer}
          rol={usuario?.role}
          fetchData={fetchData}
          loading={loading}
          error={error}
        />

        {selectedCustomer && (
          <ViewModal
            data={selectedCustomer}
            type="delivered"
            onClose={() => setSelectedCustomer(null)}
          />
        )}
      </div>
    </div>
  );
}
