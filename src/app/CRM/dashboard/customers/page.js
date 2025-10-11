'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/authContext';
import useCustomers from '@/lib/api/hooks/useCustomers';
import Table from '@/components/dashboard/tables/table';
import Header from '@/components/dashboard/customers/header';
import AlertModal from '@/components/dashboard/modals/alertModal';
import ViewModal from '../../viewModal';

export default function Customers() {
  const [archivo, setArchivo] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });
  const { usuario } = useAuth();

  const { getCustomers, importCustomers, loading, error } = useCustomers();

  const fetchCustomers = async () => {
    try {
      const { data } = await getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleFileChange = (e) => setArchivo(e.target.files?.[0] || null);
  const handleRemoveFile = () => setArchivo(null);

  const handleUpload = async () => {
    if (!archivo) return;
    try {
      await importCustomers(archivo);
      setArchivo(null);
      setAlert({
        type: 'success',
        message: 'Importación de clientes creada correctamente.',
      });
      await fetchCustomers();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al subir archivo',
      });
    }
  };

  return (
    <div className="w-full p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
          Listado de Clientes
        </h1>
        <Header
          usuario={usuario}
          archivo={archivo}
          handleFileChange={handleFileChange}
          handleRemoveFile={handleRemoveFile}
          handleUpload={handleUpload}
        />
      </div>

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        {loading && (
          <p className="text-gray-500 text-sm p-4">Cargando clientes...</p>
        )}
        {error && <p className="text-red-500 text-sm p-4">{error}</p>}

        <Table
          info={customers || []}
          view="customers"
          setSelected={setSelectedCustomer}
          rol={usuario?.role}
          fetchData={fetchCustomers}
          loading={loading}
          error={error}
        />

        {selectedCustomer && (
          <ViewModal
            data={selectedCustomer}
            type="customer"
            onClose={() => setSelectedCustomer(null)}
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
