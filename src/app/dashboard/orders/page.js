'use client';

import { useCallback, useEffect, useState } from 'react';
import { EyeIcon, TruckIcon } from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import Pagination from '@/components/dashboard/tables/segments/pagination';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import AlertModal from '@/components/dashboard/modals/alertModal';
import useOrders from '@/lib/api/hooks/useOrders';
import { formatCOP, formatDateTime } from '@/lib/api/utils/utils';
import OrderDetailModal from '@/components/dashboard/orders/OrderDetailModal';
import {
  SHIPPING_STATUS_OPTIONS,
  shippingBadge,
  paymentBadge,
  orderCustomerName,
  orderCustomerPhone,
} from '@/components/dashboard/orders/orderHelpers';

export default function Orders() {
  const { getOrders, loading } = useOrders();

  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState({
    code: '',
    customer: '',
    shippingStatus: '',
  });
  const [selected, setSelected] = useState(null);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const fetchOrders = useCallback(async () => {
    try {
      const res = await getOrders({ page, limit, ...filters });
      setOrders(res.data || []);
      setMeta(res.meta || null);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Error al cargar pedidos' });
    }
  }, [getOrders, page, limit, filters]);

  useEffect(() => {
    const t = setTimeout(fetchOrders, 300);
    return () => clearTimeout(t);
  }, [fetchOrders]);

  const handleFilter = (key, value) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  };

  return (
    <RoleGuard allowedRoles={Object.values(Roles)}>
      <div className="w-full p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Pedidos</h1>
            <p className="text-sm text-gray-500">
              Pedidos recibidos desde tu tienda online.
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <input
            value={filters.code}
            onChange={(e) => handleFilter('code', e.target.value)}
            placeholder="Buscar # de pedido"
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <input
            value={filters.customer}
            onChange={(e) => handleFilter('customer', e.target.value)}
            placeholder="Buscar cliente (nombre, teléfono, correo)"
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <select
            value={filters.shippingStatus}
            onChange={(e) => handleFilter('shippingStatus', e.target.value)}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Todos los estados de envío</option>
            {SHIPPING_STATUS_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative bg-white rounded-2xl shadow border border-gray-100">
          <LoadingOverlay show={loading} text="Cargando pedidos..." />

          {/* Tabla (desktop) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="px-5 py-3 font-medium">Pedido</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Contacto</th>
                  <th className="px-5 py-3 font-medium text-center">Ítems</th>
                  <th className="px-5 py-3 font-medium text-right">Total</th>
                  <th className="px-5 py-3 font-medium">Pago</th>
                  <th className="px-5 py-3 font-medium">Envío</th>
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium text-center">Ver</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && !loading && (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-gray-400">
                      Aún no hay pedidos.
                    </td>
                  </tr>
                )}
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-gray-50 hover:bg-orange-50/40 transition cursor-pointer"
                    onClick={() => setSelected(o.id)}
                  >
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {o.code}
                    </td>
                    <td className="px-5 py-4">{orderCustomerName(o)}</td>
                    <td className="px-5 py-4 text-gray-500">
                      {orderCustomerPhone(o) || '—'}
                    </td>
                    <td className="px-5 py-4 text-center">{o._count?.items ?? 0}</td>
                    <td className="px-5 py-4 text-right font-semibold text-gray-800">
                      {formatCOP(o.totalAmount)}
                    </td>
                    <td className="px-5 py-4">{paymentBadge(o.paymentStatus)}</td>
                    <td className="px-5 py-4">{shippingBadge(o.shippingStatus)}</td>
                    <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                      {formatDateTime(o.saleDate)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(o.id);
                        }}
                        className="text-orange-500 hover:text-orange-600"
                        title="Ver pedido"
                      >
                        <EyeIcon className="w-5 h-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tarjetas (móvil) */}
          <div className="md:hidden divide-y divide-gray-100">
            {orders.length === 0 && !loading && (
              <p className="px-5 py-10 text-center text-gray-400">
                Aún no hay pedidos.
              </p>
            )}
            {orders.map((o) => (
              <button
                key={o.id}
                onClick={() => setSelected(o.id)}
                className="w-full text-left px-4 py-4 hover:bg-orange-50/40 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{o.code}</span>
                  <span className="font-semibold text-gray-800">
                    {formatCOP(o.totalAmount)}
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  {orderCustomerName(o)} · {orderCustomerPhone(o) || 'sin teléfono'}
                </div>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  {paymentBadge(o.paymentStatus)}
                  {shippingBadge(o.shippingStatus)}
                  <span className="text-xs text-gray-400">
                    {formatDateTime(o.saleDate)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {meta && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              limit={limit}
              setPage={setPage}
              setLimit={setLimit}
            />
          )}
        </div>

        {selected && (
          <OrderDetailModal
            orderId={selected}
            onClose={() => setSelected(null)}
            onUpdated={() => {
              fetchOrders();
              setAlert({ type: 'success', message: 'Pedido actualizado.' });
            }}
          />
        )}

        <AlertModal
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: '', message: '' })}
        />
      </div>
    </RoleGuard>
  );
}
