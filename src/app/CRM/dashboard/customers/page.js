'use client';

import { useCallback, useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import ViewModal from '../../viewModal';
import Table from '@/components/dashboard/tables/table';
import Link from 'next/link';
import RoleGuard from '@/auth/roleGuard';
import { useAuth } from '@/context/authContext';
import { Roles } from '@/config/roles';
import useCustomers from '@/lib/api/hooks/useCustomers';
import { getHeaderTableCustomers } from '@/lib/api/utils/customers.config';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState(null);
  const { usuario } = useAuth();

  const { getCustomers, loading, error } = useCustomers();

  const fetchCustomers = useCallback(async () => {
    try {
      const { data } = await getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    }
  }, [getCustomers]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return (
    <RoleGuard allowedRoles={Object.values(Roles)}>
      <div className="w-full p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
            Listado de Clientes
          </h1>

          <div className="flex gap-2">
            <Link
              href="/CRM/dashboard/customers/new"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
            >
              <PlusIcon className="w-4 h-4" />
              Agregar cliente
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <Table
            header={getHeaderTableCustomers()}
            info={customers}
            view="customers"
            setSelected={setSelectedCustomers}
            rol={usuario?.role}
            fetchData={fetchCustomers}
            loading={loading}
            error={error}
          />
          {selectedCustomers && (
            <ViewModal
              data={selectedCustomers}
              type="customers"
              onClose={() => setSelectedCustomers(null)}
            />
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
