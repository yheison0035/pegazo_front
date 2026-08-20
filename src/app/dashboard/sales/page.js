'use client';

import { useState, useEffect } from 'react';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { useAuth } from '@/context/authContext';
import useTerms from '@/hooks/useTerms';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import useSales from '@/lib/api/hooks/useSales';
import { getEmptySale, getFormFieldsSales } from '@/lib/api/utils/sales.config';

// Fecha/hora actual en formato datetime-local (YYYY-MM-DDTHH:mm), hora local.
function nowLocalDatetime() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

// Venta con defaults inteligentes para agilizar el mostrador: fecha=ahora,
// vendedor = usuario actual, local = local del usuario (si tiene uno).
function buildInitialSale(usuario) {
  return {
    ...getEmptySale(),
    saleDate: nowLocalDatetime(),
    userId: usuario?.id ? String(usuario.id) : '',
    localId: usuario?.localId ? String(usuario.localId) : '',
  };
}

export default function AddSales() {
  const [formData, setFormData] = useState(getEmptySale());
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });
  const auth = useAuth();
  const usuario = auth?.usuario;

  const { createSale, loading } = useSales();
  const t = useTerms();

  // Al cargar el usuario, rellena los defaults (sin pisar lo que ya haya tocado).
  useEffect(() => {
    if (!usuario) return;
    setFormData((prev) => ({
      ...prev,
      saleDate: prev.saleDate || nowLocalDatetime(),
      userId: prev.userId || (usuario.id ? String(usuario.id) : ''),
      localId: prev.localId || (usuario.localId ? String(usuario.localId) : ''),
    }));
  }, [usuario]);

  const handleReset = () => setFormData(buildInitialSale(usuario));

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
        formFields={getFormFieldsSales(t)}
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
