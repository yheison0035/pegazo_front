'use client';

import { useEffect, useRef, useState } from 'react';
import {
  XMarkIcon,
  TruckIcon,
  CheckBadgeIcon,
  UserIcon,
  MapPinIcon,
  ShieldCheckIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
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
  orderConfirmMessage,
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
  const [failReason, setFailReason] = useState('');
  const [reschedule, setReschedule] = useState('');
  const [saving, setSaving] = useState(false);

  // Refs para no re-ejecutar la carga en cada re-render (evita borrar el form).
  const getOrderByIdRef = useRef(getOrderById);
  getOrderByIdRef.current = getOrderById;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getOrderByIdRef.current(orderId);
        if (!active) return;
        applyOrder(res.data);
      } catch (e) {
        onCloseRef.current();
      }
    })();
    return () => {
      active = false;
    };
  }, [orderId]);

  const applyOrder = (o) => {
    setOrder(o);
    setForm({
      shippingStatus: o.shippingStatus || 'PENDIENTE',
      carrier: o.shipment?.carrier || '',
      trackingNumber: o.shipment?.trackingNumber || '',
      notes: o.shipment?.notes || '',
    });
  };

  const confirmed = !!order?.confirmedAt;

  // Abre WhatsApp del cliente con el mensaje indicado (dentro del click, para no
  // bloquear el pop-up).
  const openWhatsapp = (message) => {
    if (!order) return;
    const url = orderWhatsappUrl(order, message);
    if (url) window.open(url, '_blank', 'noopener');
  };

  const buildPayload = (override = {}) => {
    const next = { ...form, ...override };
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

  // Paso 1: marcar el pedido como confirmado (interno; el cliente no lo ve).
  const confirmOrder = async () => {
    setSaving(true);
    try {
      const res = await updateOrderFulfillment(orderId, { confirm: true });
      applyOrder(res.data);
      onUpdated?.();
    } catch (e) {
      /* deja abierto */
    } finally {
      setSaving(false);
    }
  };

  // Paso 2: guardar el estado del envío (avisa al cliente por correo automático).
  const save = async () => {
    setSaving(true);
    try {
      await updateOrderFulfillment(orderId, buildPayload());
      onUpdated?.();
      onClose();
    } catch (e) {
      /* deja abierto para reintentar */
    } finally {
      setSaving(false);
    }
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
      /* noop */
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
      /* noop */
    } finally {
      setSaving(false);
    }
  };

  const address = order ? orderShippingAddress(order) : '';
  const phone = order ? orderCustomerPhone(order) : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-3xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Cabecera */}
        <div className="flex items-center justify-between bg-gradient-to-r from-orange-600 to-[#111827] text-white px-6 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold truncate">
                Pedido {order?.code || `#${orderId}`}
              </h2>
              {confirmed && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                  <CheckBadgeIcon className="w-4 h-4" />
                  Confirmado
                </span>
              )}
            </div>
            {order && (
              <p className="text-sm opacity-80">{formatDateTime(order.saleDate)}</p>
            )}
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/60">
          {!order ? (
            <p className="text-center text-gray-400 py-10">Cargando pedido...</p>
          ) : (
            <>
              {/* Cliente + Dirección */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-100 bg-white p-4">
                  <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-gray-400 mb-2">
                    <UserIcon className="w-4 h-4" /> Cliente
                  </p>
                  <p className="font-semibold text-gray-800">
                    {orderCustomerName(order)}
                  </p>
                  <p className="text-sm text-gray-500">{phone || 'Sin teléfono'}</p>
                  {order.ecommerceCustomer?.email && (
                    <p className="text-sm text-gray-500 truncate">
                      {order.ecommerceCustomer.email}
                    </p>
                  )}
                  {phone && (
                    <a
                      href={orderWhatsappUrl(order, orderConfirmMessage(order))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-600"
                    >
                      <WhatsappIcon className="w-4 h-4" />
                      Escribir por WhatsApp
                    </a>
                  )}
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-4">
                  <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-gray-400 mb-2">
                    <MapPinIcon className="w-4 h-4" /> Dirección de envío
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

              {/* Estados + total */}
              <div className="flex items-center gap-3 flex-wrap rounded-xl border border-gray-100 bg-white p-4">
                <span className="text-sm text-gray-500">Pago:</span>
                {paymentBadge(order.paymentStatus)}
                <span className="text-sm text-gray-500 ml-2">Envío:</span>
                {shippingBadge(order.shippingStatus)}
                <span className="ml-auto text-lg font-bold text-gray-800">
                  {formatCOP(order.totalAmount)}
                </span>
              </div>

              {/* Productos */}
              <div className="rounded-xl border border-gray-100 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                  Productos
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      {order.items?.map((it) => (
                        <tr
                          key={it.id}
                          className="border-b border-gray-50 last:border-0"
                        >
                          <td className="py-2 text-gray-700">
                            {it.variant?.inventory?.name ||
                              it.service?.name ||
                              'Producto'}
                          </td>
                          <td className="py-2 text-center text-gray-500">
                            x{it.quantity}
                          </td>
                          <td className="py-2 text-right text-gray-700">
                            {formatCOP(it.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PASO 1 · Confirmación (gate) */}
              {!confirmed ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                      1
                    </span>
                    <p className="font-semibold text-gray-800">
                      Confirma el pedido con el cliente
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Escríbele por WhatsApp para confirmar el pedido y la
                    dirección. Cuando el cliente confirme, márcalo aquí para
                    continuar con el envío.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {phone && (
                      <button
                        onClick={() => openWhatsapp(orderConfirmMessage(order))}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-green-500 bg-white px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50"
                      >
                        <WhatsappIcon className="w-4 h-4" />
                        Confirmar por WhatsApp
                      </button>
                    )}
                    <button
                      onClick={confirmOrder}
                      disabled={saving || loading}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                    >
                      <CheckBadgeIcon className="w-5 h-5" />
                      {saving ? 'Guardando...' : 'Marcar pedido confirmado'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                  <ShieldCheckIcon className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-medium text-green-800">
                    Pedido confirmado
                    {order.confirmedAt
                      ? ` · ${formatDateTime(order.confirmedAt)}`
                      : ''}
                  </p>
                </div>
              )}

              {/* PASO 2 · Gestión del envío (bloqueado hasta confirmar) */}
              <div
                className={`relative rounded-xl border p-4 ${
                  confirmed
                    ? 'border-orange-100 bg-white'
                    : 'border-gray-100 bg-white opacity-60'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                      confirmed ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                  >
                    2
                  </span>
                  <TruckIcon className="w-5 h-5 text-orange-500" />
                  <p className="font-semibold text-gray-800">Gestión del envío</p>
                  {!confirmed && (
                    <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-gray-400">
                      <LockClosedIcon className="w-4 h-4" />
                      Confirma primero
                    </span>
                  )}
                </div>

                <fieldset disabled={!confirmed || saving}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600">
                        Estado del envío
                      </label>
                      <select
                        value={form.shippingStatus}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            shippingStatus: e.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">
                        Número de guía
                      </label>
                      <input
                        value={form.trackingNumber}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            trackingNumber: e.target.value,
                          }))
                        }
                        placeholder="N° de seguimiento"
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">
                        Notas
                      </label>
                      <input
                        value={form.notes}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, notes: e.target.value }))
                        }
                        placeholder="Observaciones del envío"
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
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

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openWhatsapp(shippingMessage(form.shippingStatus, order))
                      }
                      disabled={!phone}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
                    >
                      <WhatsappIcon className="w-4 h-4" />
                      Notificar por WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={save}
                      disabled={saving || loading}
                      className="ml-auto rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                    >
                      {saving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </fieldset>
              </div>

              {/* Cancelar / eliminar */}
              {order.saleStatus !== 'CANCELADA' && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 bg-white p-3">
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
