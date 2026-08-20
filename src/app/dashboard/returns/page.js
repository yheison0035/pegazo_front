'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import useReturns from '@/lib/api/hooks/useReturns';
import { getSales } from '@/lib/api/routes/sales';
import { formatCOP, formatDateTime } from '@/lib/api/utils/utils';
import Pagination from '@/components/dashboard/tables/segments/pagination';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import AlertModal from '@/components/dashboard/modals/alertModal';
import Button from '@/components/ui/Button';

export default function ReturnsPage() {
  const {
    getReturns,
    getReturnById,
    getSaleForReturn,
    createReturn,
    loading,
  } = useReturns();

  const [returns, setReturns] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [detail, setDetail] = useState(null);

  // Nueva devolución
  const [showForm, setShowForm] = useState(false);
  const [saleSearch, setSaleSearch] = useState('');
  const [saleResults, setSaleResults] = useState([]);
  const [sale, setSale] = useState(null); // venta cargada para devolver
  const [qty, setQty] = useState({}); // { saleItemId: cantidad }
  const [reason, setReason] = useState('');

  const fetchReturns = useCallback(async () => {
    try {
      const res = await getReturns({ page, limit });
      setReturns(res.data || []);
      setMeta(res.meta || null);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Error al cargar' });
    }
  }, [getReturns, page, limit]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  // Buscar venta por código
  useEffect(() => {
    const term = saleSearch.trim();
    if (term.length < 3 || sale) {
      setSaleResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await getSales({ code: term, limit: 6 });
        setSaleResults(res?.data || []);
      } catch (_) {
        setSaleResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [saleSearch, sale]);

  const pickSale = async (s) => {
    try {
      const res = await getSaleForReturn(s.id);
      setSale(res.data);
      setSaleResults([]);
      setSaleSearch('');
      setQty({});
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'No se pudo cargar la venta' });
    }
  };

  const refundTotal = sale
    ? sale.items.reduce(
        (s, it) => s + (Number(qty[it.saleItemId]) || 0) * it.price,
        0
      )
    : 0;

  const resetForm = () => {
    setShowForm(false);
    setSale(null);
    setSaleSearch('');
    setSaleResults([]);
    setQty({});
    setReason('');
  };

  const handleCreate = async () => {
    const items = Object.entries(qty)
      .filter(([, q]) => Number(q) > 0)
      .map(([saleItemId, q]) => ({
        saleItemId: Number(saleItemId),
        quantity: Number(q),
      }));
    if (items.length === 0) {
      setAlert({ type: 'error', message: 'Indica al menos una cantidad a devolver.' });
      return;
    }
    try {
      await createReturn({ saleId: sale.id, reason, items });
      setAlert({
        type: 'success',
        message: 'Devolución registrada. El stock se reingresó.',
      });
      resetForm();
      fetchReturns();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'No se pudo registrar' });
    }
  };

  const openDetail = async (id) => {
    try {
      const res = await getReturnById(id);
      setDetail(res.data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  return (
    <RoleGuard allowedRoles={Object.values(Roles)}>
      <div className="w-full p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Devoluciones</h1>
            <p className="text-sm text-gray-500">
              Devuelve productos de una venta. El stock vuelve al inventario.
            </p>
          </div>
          {!showForm && (
            <Button variant="add" icon={PlusIcon} onClick={() => setShowForm(true)}>
              Nueva devolución
            </Button>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Nueva devolución
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-700">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Paso 1: elegir venta */}
            {!sale && (
              <div className="relative">
                <label className="text-xs font-medium text-gray-600">
                  Buscar la venta por su número
                </label>
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                  <input
                    value={saleSearch}
                    onChange={(e) => setSaleSearch(e.target.value)}
                    placeholder="Ej: SALE-1787... (mín. 3 caracteres)"
                    className="flex-1 text-sm focus:outline-none"
                  />
                </div>
                {saleResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {saleResults.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => pickSale(s)}
                        className="w-full text-left px-3 py-2 hover:bg-orange-50 text-sm flex justify-between"
                      >
                        <span>
                          {s.code}
                          <span className="text-gray-400">
                            {' '}
                            · {s.customer?.name || 'Consumidor final'}
                          </span>
                        </span>
                        <span className="text-gray-500">
                          {formatCOP(s.totalAmount)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Paso 2: elegir cantidades */}
            {sale && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-800">{sale.code}</p>
                    <p className="text-xs text-gray-500">
                      {sale.customer?.name || 'Consumidor final'} ·{' '}
                      {formatDateTime(sale.saleDate)}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSale(null);
                      setQty({});
                    }}
                    className="text-sm text-orange-600 hover:underline"
                  >
                    Cambiar venta
                  </button>
                </div>

                <div className="rounded-xl border border-gray-100 overflow-hidden mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 bg-gray-50">
                        <th className="px-3 py-2 font-medium">Producto</th>
                        <th className="px-3 py-2 font-medium text-center">Vendido</th>
                        <th className="px-3 py-2 font-medium text-center">Ya devuelto</th>
                        <th className="px-3 py-2 font-medium text-center w-28">Devolver</th>
                        <th className="px-3 py-2 font-medium text-right">Reembolso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sale.items.map((it) => {
                        const disabled = it.remaining <= 0;
                        const q = Number(qty[it.saleItemId]) || 0;
                        return (
                          <tr key={it.saleItemId} className="border-t border-gray-50">
                            <td className="px-3 py-2">
                              {it.name}
                              {it.color && it.color !== 'ÚNICO' ? ` · ${it.color}` : ''}
                              {it.size ? ` · ${it.size}` : ''}
                              {!it.inventoryVariantId && (
                                <span className="ml-1 text-xs text-gray-400">
                                  (servicio)
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center">{it.soldQuantity}</td>
                            <td className="px-3 py-2 text-center text-gray-400">
                              {it.returnedQuantity}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="number"
                                min="0"
                                max={it.remaining}
                                disabled={disabled}
                                value={qty[it.saleItemId] ?? ''}
                                onChange={(e) => {
                                  let v = Number(e.target.value);
                                  if (v > it.remaining) v = it.remaining;
                                  if (v < 0) v = 0;
                                  setQty((prev) => ({ ...prev, [it.saleItemId]: v }));
                                }}
                                placeholder="0"
                                className="w-20 rounded border border-gray-200 px-2 py-1 text-sm disabled:bg-gray-100"
                              />
                              <div className="text-[10px] text-gray-400">
                                máx {it.remaining}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right">
                              {formatCOP(q * it.price)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Motivo (opcional): defectuoso, cambio de talla…"
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <div className="text-right">
                    <span className="text-sm text-gray-500 mr-2">Reembolso:</span>
                    <span className="text-lg font-bold text-gray-800">
                      {formatCOP(refundTotal)}
                    </span>
                  </div>
                  <button
                    onClick={handleCreate}
                    disabled={loading || refundTotal <= 0}
                    className="rounded-lg bg-orange-500 px-6 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                  >
                    Registrar devolución
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Listado */}
        <div className="relative bg-white rounded-2xl shadow border border-gray-100">
          <LoadingOverlay show={loading} text="Cargando..." />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="px-5 py-3 font-medium">Devolución</th>
                  <th className="px-5 py-3 font-medium">Venta</th>
                  <th className="px-5 py-3 font-medium text-center">Ítems</th>
                  <th className="px-5 py-3 font-medium text-right">Reembolso</th>
                  <th className="px-5 py-3 font-medium">Motivo</th>
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium text-center">Ver</th>
                </tr>
              </thead>
              <tbody>
                {returns.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                      Aún no hay devoluciones.
                    </td>
                  </tr>
                )}
                {returns.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-orange-50/40">
                    <td className="px-5 py-3 font-medium text-gray-800">{r.code}</td>
                    <td className="px-5 py-3 text-gray-600">{r.sale?.code}</td>
                    <td className="px-5 py-3 text-center">{r._count?.items ?? 0}</td>
                    <td className="px-5 py-3 text-right font-semibold text-red-600">
                      {formatCOP(r.total)}
                    </td>
                    <td className="px-5 py-3 text-gray-500 truncate max-w-[16rem]">
                      {r.reason || '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                      {formatDateTime(r.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => openDetail(r.id)}
                        className="text-orange-500 hover:text-orange-600 text-sm font-medium"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

        {/* Detalle */}
        {detail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white w-full max-w-xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between bg-gradient-to-r from-orange-600 to-gray-900 text-white px-6 py-4">
                <div className="flex items-center gap-2">
                  <ArrowUturnLeftIcon className="w-5 h-5" />
                  <div>
                    <h2 className="text-lg font-bold">{detail.code}</h2>
                    <p className="text-sm opacity-80">Venta {detail.sale?.code}</p>
                  </div>
                </div>
                <button onClick={() => setDetail(null)} className="text-white/80 hover:text-white">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <table className="w-full text-sm mb-4">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="py-2">Producto</th>
                      <th className="py-2 text-center">Cant.</th>
                      <th className="py-2 text-right">Precio</th>
                      <th className="py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items?.map((it) => (
                      <tr key={it.id} className="border-b border-gray-50">
                        <td className="py-2">{it.name}</td>
                        <td className="py-2 text-center">{it.quantity}</td>
                        <td className="py-2 text-right">{formatCOP(it.price)}</td>
                        <td className="py-2 text-right">{formatCOP(it.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-right text-lg font-bold text-red-600">
                  Reembolso: {formatCOP(detail.total)}
                </div>
                {detail.reason && (
                  <p className="mt-2 text-sm text-gray-500">Motivo: {detail.reason}</p>
                )}
              </div>
            </div>
          </div>
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
