'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon, TruckIcon } from '@heroicons/react/24/outline';
import useOrders from '@/lib/api/hooks/useOrders';
import { formatCOP, formatDateTime } from '@/lib/api/utils/utils';
import {
  SHIPPING_STATUS_OPTIONS,
  shippingBadge,
  paymentBadge,
  orderCustomerName,
  orderCustomerPhone,
  orderShippingAddress,
} from './orderHelpers';

export default function OrderDetailModal({ orderId, onClose, onUpdated }) {
  const { getOrderById, updateOrderFulfillment, loading } = useOrders();
  const [order, setOrder] = useState(null);
  const [form, setForm] = useState({
    shippingStatus: '',
    carrier: '',
    trackingNumber: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getOrderById(orderId);
        if (!active) return;
        const o = res.data;
        setOrder(o);
        setForm({
          shippingStatus: o.shippingStatus || 'PENDIENTE',
          carrier: o.shipment?.carrier || '',
          trackingNumber: o.shipment?.trackingNumber || '',
          notes: o.shipment?.notes || '',
        });
      } catch (e) {
        // el modal se cierra si falla la carga
        onClose();
      }
    })();
    return () => {
      active = false;
    };
  }, [orderId, getOrderById, onClose]);

  const save = async (override = {}) => {
    setSaving(true);
    try {
      await updateOrderFulfillment(orderId, { ...form, ...override });
      onUpdated?.();
      onClose();
    } catch (e) {
      // deja el modal abierto para reintentar
    } finally {
      setSaving(false);
    }
  };

  const address = order ? orderShippingAddress(order) : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Cabecera */}
        <div className="flex items-center justify-between bg-gradient-to-r from-orange-600 to-gray-900 text-white px-6 py-4">
          <div>
            <h2 className="text-xl font-bold">
              Pedido {order?.code || `#${orderId}`}
            </h2>
            {order && (
              <p className="text-sm opacity-80">
                {formatDateTime(order.saleDate)}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!order ? (
            <p className="text-center text-gray-400 py-10">Cargando pedido...</p>
          ) : (
            <>
              {/* Resumen */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-xs uppercase text-gray-400 mb-1">Cliente</p>
                  <p className="font-medium text-gray-800">
                    {orderCustomerName(order)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {orderCustomerPhone(order) || 'Sin teléfono'}
                  </p>
                  {order.ecommerceCustomer?.email && (
                    <p className="text-sm text-gray-500">
                      {order.ecommerceCustomer.email}
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-xs uppercase text-gray-400 mb-1">
                    Dirección de envío
                  </p>
                  <p className="text-sm text-gray-700">
                    {address || 'No registrada'}
                  </p>
                  {order.ecommerceCustomer?.isHardToAccess && (
                    <p className="mt-1 text-xs font-medium text-amber-600">
                      Zona de difícil acceso
                    </p>
                  )}
                </div>
              </div>

              {/* Estados */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-gray-500">Pago:</span>
                {paymentBadge(order.paymentStatus)}
                <span className="text-sm text-gray-500 ml-2">Envío:</span>
                {shippingBadge(order.shippingStatus)}
                <span className="ml-auto text-lg font-bold text-gray-800">
                  {formatCOP(order.totalAmount)}
                </span>
              </div>

              {/* Ítems */}
              <div>
                <p className="text-xs uppercase text-gray-400 mb-2">Productos</p>
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {order.items?.map((it) => (
                        <tr key={it.id} className="border-b border-gray-50 last:border-0">
                          <td className="px-4 py-2 text-gray-700">
                            {it.variant?.inventory?.name ||
                              it.service?.name ||
                              'Producto'}
                          </td>
                          <td className="px-4 py-2 text-center text-gray-500">
                            x{it.quantity}
                          </td>
                          <td className="px-4 py-2 text-right text-gray-700">
                            {formatCOP(it.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Gestión de envío */}
              <div className="rounded-xl border border-orange-100 bg-orange-50/40 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TruckIcon className="w-5 h-5 text-orange-500" />
                  <p className="font-semibold text-gray-800">Gestión del envío</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      Estado del envío
                    </label>
                    <select
                      value={form.shippingStatus}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, shippingStatus: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {SHIPPING_STATUS_OPTIONS.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      Transportadora
                    </label>
                    <input
                      value={form.carrier}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, carrier: e.target.value }))
                      }
                      placeholder="Ej: Servientrega, mensajero…"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      Número de guía
                    </label>
                    <input
                      value={form.trackingNumber}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, trackingNumber: e.target.value }))
                      }
                      placeholder="N° de seguimiento"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Notas</label>
                    <input
                      value={form.notes}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, notes: e.target.value }))
                      }
                      placeholder="Observaciones del envío"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => save({ shippingStatus: 'EN_CAMINO' })}
                    disabled={saving || loading}
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Marcar en camino
                  </button>
                  <button
                    onClick={() => save({ shippingStatus: 'ENTREGADO' })}
                    disabled={saving || loading}
                    className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Marcar entregado
                  </button>
                  <button
                    onClick={() => save()}
                    disabled={saving || loading}
                    className="ml-auto rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                  >
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
