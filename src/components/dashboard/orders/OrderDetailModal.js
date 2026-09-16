'use client';

import { useEffect, useRef, useState } from 'react';
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
  orderWhatsappUrl,
  shippingMessage,
  WhatsappIcon,
} from './orderHelpers';

export default function OrderDetailModal({ orderId, onClose, onUpdated }) {
  const {
    getOrderById,
    updateOrderFulfillment,
    cancelOrder,
    deleteOrder,
    loading,
  } = useOrders();
  const [order, setOrder] = useState(null);
  const [form, setForm] = useState({
    shippingStatus: '',
    carrier: '',
    trackingNumber: '',
    notes: '',
  });
  // Solo para "No entregado": motivo + fecha de reprogramación.
  const [failReason, setFailReason] = useState('');
  const [reschedule, setReschedule] = useState('');
  const [saving, setSaving] = useState(false);

  // Refs para no re-ejecutar la carga en cada re-render del padre (antes las deps
  // getOrderById/onChange cambiaban de identidad y el efecto se volvía a correr,
  // reseteando el formulario y BORRANDO lo que el usuario estaba escribiendo).
  const getOrderByIdRef = useRef(getOrderById);
  getOrderByIdRef.current = getOrderById;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Solo carga cuando cambia el pedido seleccionado (orderId), nunca por un
  // re-render del listado en vivo.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getOrderByIdRef.current(orderId);
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
        onCloseRef.current();
      }
    })();
    return () => {
      active = false;
    };
  }, [orderId]);

  // Abre el WhatsApp del cliente con el mensaje del estado indicado. Se llama
  // ANTES de guardar (dentro del gesto del usuario) para evitar el bloqueo de
  // pop-ups del navegador.
  const notify = (status) => {
    if (!order) return;
    const url = orderWhatsappUrl(order, shippingMessage(status, order));
    if (url) window.open(url, '_blank', 'noopener');
  };

  const buildPayload = (override = {}) => {
    const next = { ...form, ...override };
    // "No entregado": adjunta motivo + reprogramación a las notas.
    if (next.shippingStatus === 'FALLIDO') {
      const extra = [
        failReason ? `No entregado: ${failReason}` : '',
        reschedule ? `Reprogramar: ${reschedule}` : '',
      ]
        .filter(Boolean)
        .join(' · ');
      if (extra) next.notes = [form.notes, extra].filter(Boolean).join(' — ');
    }
    return next;
  };

  const save = async (override = {}) => {
    setSaving(true);
    try {
      await updateOrderFulfillment(orderId, buildPayload(override));
      onUpdated?.();
      onClose();
    } catch (e) {
      // deja el modal abierto para reintentar
    } finally {
      setSaving(false);
    }
  };

  // Guarda el estado elegido y de una vez abre el WhatsApp para avisar al cliente.
  const saveAndNotify = async (status) => {
    notify(status); // síncrono, dentro del click
    await save({ shippingStatus: status });
  };

  const doCancel = async () => {
    if (
      !window.confirm(
        '¿Cancelar este pedido? Si ya se había descontado inventario, se devolverá al stock.',
      )
    )
      return;
    setSaving(true);
    try {
      await cancelOrder(orderId);
      onUpdated?.();
      onClose();
    } catch (e) {
      // deja abierto para reintentar
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (
      !window.confirm(
        '¿Eliminar el pedido por completo? Esta acción no se puede deshacer (el stock se restaura).',
      )
    )
      return;
    setSaving(true);
    try {
      await deleteOrder(orderId);
      onUpdated?.();
      onClose();
    } catch (e) {
      // deja abierto para reintentar
    } finally {
      setSaving(false);
    }
  };

  const address = order ? orderShippingAddress(order) : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Cabecera */}
        <div className="flex items-center justify-between bg-gradient-to-r from-orange-600 to-[#111827] text-white px-6 py-4">
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
                <div className="rounded-xl border border-gray-100 overflow-x-auto">
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

                {/* No entregado: motivo + reprogramación */}
                {form.shippingStatus === 'FALLIDO' && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 rounded-lg border border-red-100 bg-red-50/50 p-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600">
                        Motivo de no entrega
                      </label>
                      <input
                        value={failReason}
                        onChange={(e) => setFailReason(e.target.value)}
                        placeholder="Ej: cliente ausente, dirección errada…"
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">
                        Reprogramar entrega
                      </label>
                      <input
                        type="date"
                        value={reschedule}
                        onChange={(e) => setReschedule(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                      />
                    </div>
                  </div>
                )}

                {/* Cambios rápidos de estado (guardan y avisan al cliente) */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => saveAndNotify('ASIGNADO_TRANSPORTADORA')}
                    disabled={saving || loading}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Despachado
                  </button>
                  <button
                    onClick={() => saveAndNotify('EN_CAMINO')}
                    disabled={saving || loading}
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    En camino
                  </button>
                  <button
                    onClick={() => saveAndNotify('ENTREGADO')}
                    disabled={saving || loading}
                    className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Entregado
                  </button>
                  <button
                    onClick={() => saveAndNotify('FALLIDO')}
                    disabled={saving || loading}
                    className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    No entregado
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => notify(form.shippingStatus)}
                    disabled={!orderCustomerPhone(order)}
                    title={
                      orderCustomerPhone(order)
                        ? 'Avisar al cliente por WhatsApp el estado actual'
                        : 'El pedido no tiene teléfono'
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
                  >
                    <WhatsappIcon className="w-4 h-4" />
                    Notificar por WhatsApp
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

              {/* Cancelar / eliminar el pedido (devuelve stock si corresponde) */}
              {order.saleStatus !== 'CANCELADA' && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 p-3">
                  <p className="text-sm text-gray-500">
                    ¿El cliente desistió o hubo un error?
                  </p>
                  <div className="ml-auto flex gap-2">
                    <button
                      onClick={doCancel}
                      disabled={saving || loading}
                      className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                    >
                      Cancelar y devolver stock
                    </button>
                    <button
                      onClick={doDelete}
                      disabled={saving || loading}
                      className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
