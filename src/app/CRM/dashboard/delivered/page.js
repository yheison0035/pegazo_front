'use client';

import { useState } from 'react';
import ViewModal from '../../viewModal';
import Table from '@/components/dashboard/tables/table';
import { useAuth } from '@/context/authContext';
import { customers } from '@/api/customers';

export default function Delivered() {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const { usuario } = useAuth();

  return (
    <div className="w-full p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
          Listado de Clientes Entregados
        </h1>
      </div>

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <Table
          info={customers}
          view="customers"
          setSelected={setSelectedCustomer}
          rol={usuario?.rol}
          delivered={true}
        />
        {selectedCustomer && (
          <ViewModal
            data={selectedCustomer}
            type="customer"
            onClose={() => setSelectedCustomer(null)}
          />
        )}
      </div>
    </div>
  );
}
