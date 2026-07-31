'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import AlertModal from '@/components/dashboard/modals/alertModal';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import { useAuth } from '@/context/authContext';
import useDeliveredSales from '@/lib/api/hooks/useDeliveredSales';
import { getFormFieldsSales } from '@/lib/api/utils/sales.config';

export default function EditDeliveredSales() {
  const [formData, setFormData] = useState({});
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });
  const { id } = useParams();
  const auth = useAuth();
  const usuario = auth?.usuario;
  const { getDeliveredSaleById, updateDeliveredSale, loading } =
    useDeliveredSales();

  const fetchDeliveredSale = useCallback(async () => {
    if (!id) return;

    try {
      const { data } = await getDeliveredSaleById(Number(id));

      const formattedItems = (data.items || []).map((item) => ({
        ...(item.type === 'service'
          ? {
              serviceId: item.serviceId,
            }
          : {
              inventoryVariantId: item.inventoryVariantId,
            }),

        name: item.name,

        price: item.price,

        stock: item.type === 'service' ? null : item.stock || 0,

        originalQuantity: item.quantity,

        quantity: item.quantity,

        discount: item.discount || 0,

        subtotal: item.subtotal,
      }));

      setFormData({
        ...data,
        items: formattedItems,
      });
    } catch (err) {
      setAlert({
        type: 'warning',
        message: err.message || 'No tienes permisos',
        url: '/dashboard/delivered_sales',
      });
    }
  }, [getDeliveredSaleById, id]);

  useEffect(() => {
    fetchDeliveredSale();
  }, [fetchDeliveredSale]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateDeliveredSale(id, formData);
      setAlert({
        type: 'success',
        message: 'Venta actualizada correctamente.',
        url: '/dashboard/delivered_sales',
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al actualizar venta',
      });
    }
  };

  return (
    <div className="max-w-full mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Editar Venta</h2>
      <p className="text-sm text-gray-500 mb-6">
        Modifica la información de la venta según sea necesario.
      </p>

      <DinamicForm
        formData={formData}
        formFields={getFormFieldsSales()}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        loading={loading}
        mode="edit"
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
