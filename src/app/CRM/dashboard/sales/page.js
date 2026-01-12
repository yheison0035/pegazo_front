'use client';

import { useState } from 'react';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { useAuth } from '@/context/authContext';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import useSales from '@/lib/api/hooks/useSales';
import { getEmptySale, getFormFieldsSales } from '@/lib/api/utils/sales.config';

export default function AddSales() {
  const { usuario } = useAuth();
  const [formData, setFormData] = useState(getEmptySale());
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });

  const { createSale, loading } = useSales();

  const handleReset = () => setFormData(getEmptySale());

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.products || formData.products.length === 0) {
      return setAlert({
        type: 'warning',
        message: 'Debe agregar al menos un producto a la venta.',
      });
    }

    const payload = {
      customerId: formData.customerId || null,
      localId: usuario.localId,
      paymentMethod: formData.paymentMethod,
      items: formData.products.map((p) => ({
        inventoryVariantId: p.inventoryVariantId,
        quantity: p.quantity,
      })),
    };

    try {
      await createSale(payload);

      setAlert({
        type: 'success',
        message: 'Venta creada correctamente.',
        url: '/CRM/dashboard/delivered_sales',
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al crear venta',
      });
    }
  };

  return (
    <div className="max-w-full mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">
        Crear Venta Nueva
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Ingrese la información de la venta para registrar una nueva venta.
      </p>

      <DinamicForm
        formData={formData}
        formFields={getFormFieldsSales()}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        handleReset={handleReset}
        loading={loading}
        mode="new"
        usuario={usuario}
        module="delivered_sales"
      />

      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: '', message: '', url: '' })}
        url={alert.url}
      />
    </div>
  );
}
