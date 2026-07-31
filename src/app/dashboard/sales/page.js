'use client';

import { useState } from 'react';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { useAuth } from '@/context/authContext';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import useSales from '@/lib/api/hooks/useSales';
import { getEmptySale, getFormFieldsSales } from '@/lib/api/utils/sales.config';

export default function AddSales() {
  const [formData, setFormData] = useState(getEmptySale());
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });
  const auth = useAuth();
  const usuario = auth?.usuario;

  const { createSale, loading } = useSales();

  const handleReset = () => setFormData(getEmptySale());

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        paymentMethod: formData.paymentMethod,
        localId: formData.localId,
        customerId: formData.customerId,
        paymentStatus: formData.paymentStatus,
        saleDate: formData.saleDate,
        notes: formData.notes,
        userId: formData.userId,

        items: formData.items.map((p) => {
          if (p.type === 'service') {
            return {
              serviceId: p.inventoryVariantId,
              quantity: p.quantity,
              discount: p.discount || 0,
            };
          }

          return {
            inventoryVariantId: p.inventoryVariantId,
            quantity: p.quantity,
            discount: p.discount || 0,
          };
        }),
      };

      await createSale(payload);

      setAlert({
        type: 'success',
        message: 'Venta creada correctamente.',
        url: '/dashboard/delivered_sales',
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
        Crear Factura de Venta
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Ingrese la información de la factura para registrar una nueva factura.
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
        module="sales"
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
