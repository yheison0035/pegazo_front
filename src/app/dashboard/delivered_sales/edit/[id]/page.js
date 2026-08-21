'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import AlertModal from '@/components/dashboard/modals/alertModal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import useDeliveredSales from '@/lib/api/hooks/useDeliveredSales';
import PosSale from '@/components/pos/PosSale';

// ISO -> datetime-local (YYYY-MM-DDTHH:mm) en hora local.
function toDatetimeLocal(iso) {
  if (!iso) return undefined;
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function EditDeliveredSales() {
  const { id } = useParams();
  const { getDeliveredSaleById, updateDeliveredSale } = useDeliveredSales();
  const [initial, setInitial] = useState(null);
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });

  const fetchSale = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await getDeliveredSaleById(Number(id));

      const cart = (data.items || []).map((it) => {
        const isService =
          it.type === 'service' || (it.serviceId && !it.inventoryVariantId);
        const refId = isService ? it.serviceId : it.inventoryVariantId;
        return {
          key: isService ? `s${refId}` : `p${refId}`,
          type: isService ? 'service' : 'product',
          refId,
          name: it.name,
          color: it.color,
          size: it.size,
          stock: it.stock,
          price: it.price,
          quantity: it.quantity,
          discount: it.discount || 0,
        };
      });

      const customer =
        data.customer && data.customer.document !== '222222222222'
          ? {
              id: data.customer.id,
              name: data.customer.name,
              phone: data.customer.phone,
            }
          : null;

      setInitial({
        cart,
        customer,
        paymentMethod: data.paymentMethod,
        notes: data.notes || '',
        saleDate: toDatetimeLocal(data.saleDate),
        sellerId: data.userId,
        localId: data.localId,
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
    fetchSale();
  }, [fetchSale]);

  if (!initial) {
    return (
      <div className="relative min-h-[60vh]">
        <LoadingOverlay show text="Cargando venta..." />
        <AlertModal
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: '', message: '', url: '' })}
          url={alert.url}
        />
      </div>
    );
  }

  return (
    <PosSale
      mode="edit"
      title="Editar Venta"
      initial={initial}
      onSubmit={(payload) => updateDeliveredSale(id, payload)}
      successMessage="Venta actualizada correctamente."
      successUrl="/dashboard/delivered_sales"
    />
  );
}
