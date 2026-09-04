'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { Roles, ALL_EXCEPT_BARBER } from '@/config/roles';
import { useAuth } from '@/context/authContext';
import { getProductFields } from '@/config/verticalProfiles';
import usePurchases from '@/lib/api/hooks/usePurchases';
import useSales from '@/lib/api/hooks/useSales';
import useLocals from '@/lib/api/hooks/useLocals';
import { getProviders } from '@/lib/api/routes/providers';
import { getFiscalConfig } from '@/lib/api/routes/company';
import { formatCOP, formatDateTime } from '@/lib/api/utils/utils';
import Pagination from '@/components/dashboard/tables/segments/pagination';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import AlertModal from '@/components/dashboard/modals/alertModal';
import Button from '@/components/ui/Button';

const statusBadge = (s) => <StatusBadge status={s} />;

export default function PurchasesPage() {
  const { usuario } = useAuth();
  // Solo los negocios con variantes de color muestran el color del producto.
  const showColor =
    getProductFields(usuario?.company?.type, usuario?.company?.typeProductFields).variantType === 'color';
  const colorLabel = (c) =>
    showColor && c && c !== 'ÚNICO' ? ` · ${c}` : '';
  const {
    getPurchases,
    getPurchaseById,
    createPurchase,
    receivePurchase,
    cancelPurchase,
    loading,
  } = usePurchases();
  const { searchProducts } = useSales();
  const { getLocals } = useLocals();

  const [purchases, setPurchases] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const [showForm, setShowForm] = useState(false);
  const [detail, setDetail] = useState(null);

  const [locals, setLocals] = useState([]);
  const [providers, setProviders] = useState([]);
  const [fiscal, setFiscal] = useState(null);

  // formulario de nueva compra
  const [localId, setLocalId] = useState(usuario?.localId || '');
  const [providerId, setProviderId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);

  const fetchPurchases = useCallback(async () => {
    try {
      const res = await getPurchases({ page, limit });
      setPurchases(res.data || []);
      setMeta(res.meta || null);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Error al cargar' });
    }
  }, [getPurchases, page, limit]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  useEffect(() => {
    (async () => {
      try {
        const l = await getLocals({ all: true });
        const list = l?.data || [];
        setLocals(list);
        if (!localId && list.length) setLocalId(String(list[0].id));
      } catch (_) {}
      try {
        const p = await getProviders({ all: true });
        setProviders(p?.data || []);
      } catch (_) {}
      try {
        const f = await getFiscalConfig();
        setFiscal(f?.data || f || null);
      } catch (_) {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // buscador de productos
  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await searchProducts(term);
        const data = (res?.data || res || []).filter(
          (r) => r.type === 'product'
        );
        setResults(data);
      } catch (_) {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search, searchProducts]);

  const addItem = (r) => {
    if (items.some((i) => i.inventoryVariantId === r.id)) return;
    setItems((prev) => [
      ...prev,
      {
        inventoryVariantId: r.id,
        name: r.name,
        color: r.color,
        size: r.size,
        quantity: 1,
        unitCost: '',
      },
    ]);
    setSearch('');
    setResults([]);
  };

  const updateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((i) =>
        i.inventoryVariantId === id ? { ...i, [field]: value } : i
      )
    );
  };

  const removeItem = (id) =>
    setItems((prev) => prev.filter((i) => i.inventoryVariantId !== id));

  const total = items.reduce(
    (s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitCost) || 0),
    0
  );
  // IVA descontable de la compra (solo si la empresa es responsable de IVA).
  const responsableIVA = !!fiscal?.responsableIVA;
  const defRate = Number(fiscal?.defaultTaxRate) || 0;
  const ivaTotal = responsableIVA ? Math.round((total * defRate) / 100) : 0;
  const grandTotal = total + ivaTotal;

  const resetForm = () => {
    setItems([]);
    setProviderId('');
    setNotes('');
    setSearch('');
    setResults([]);
    setShowForm(false);
  };

  const handleCreate = async () => {
    if (!localId || items.length === 0) {
      setAlert({ type: 'error', message: 'Agrega al menos un producto.' });
      return;
    }
    try {
      await createPurchase({
        localId: Number(localId),
        providerId: providerId ? Number(providerId) : undefined,
        notes,
        items: items.map((i) => ({
          inventoryVariantId: i.inventoryVariantId,
          quantity: Number(i.quantity) || 0,
          unitCost: Number(i.unitCost) || 0,
        })),
      });
      setAlert({ type: 'success', message: 'Compra registrada.' });
      resetForm();
      fetchPurchases();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'No se pudo registrar' });
    }
  };

  const openDetail = async (id) => {
    try {
      const res = await getPurchaseById(id);
      setDetail(res.data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Error' });
    }
  };

  const handleReceive = async (id) => {
    try {
      await receivePurchase(id);
      setAlert({
        type: 'success',
        message: 'Compra recibida. El stock se actualizó.',
      });
      setDetail(null);
      fetchPurchases();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'No se pudo recibir' });
    }
  };

  const handleCancel = async (id) => {
    try {
      await cancelPurchase(id);
      setAlert({ type: 'success', message: 'Compra cancelada.' });
      setDetail(null);
      fetchPurchases();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'No se pudo cancelar' });
    }
  };

  return (
    <RoleGuard allowedRoles={ALL_EXCEPT_BARBER}>
      <div className="w-full p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Compras</h1>
            <p className="text-sm text-gray-500">
              Órdenes de compra a proveedores. Al recibir, se suma el stock.
            </p>
          </div>
          {!showForm && (
            <Button variant="add" icon={PlusIcon} onClick={() => setShowForm(true)}>
              Nueva compra
            </Button>
          )}
        </div>

        {/* Formulario de nueva compra */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Nueva compra</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-700">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {locals.length > 1 && (
                <div>
                  <label className="text-xs font-medium text-gray-600">Sede</label>
                  <select
                    value={localId}
                    onChange={(e) => setLocalId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {locals.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-gray-600">
                  Proveedor (opcional)
                </label>
                <select
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Sin proveedor</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Buscador de productos */}
            <div className="relative mb-4">
              <label className="text-xs font-medium text-gray-600">
                Agregar producto
              </label>
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Busca por nombre o SKU (mín. 2 letras)"
                  className="flex-1 text-sm focus:outline-none"
                />
              </div>
              {results.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => addItem(r)}
                      className="w-full text-left px-3 py-2 hover:bg-orange-50 text-sm flex justify-between"
                    >
                      <span>
                        {r.name}
                        {colorLabel(r.color)}
                        {r.size ? ` · ${r.size}` : ''}
                      </span>
                      <span className="text-gray-400">Stock: {r.stock}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Líneas de la compra */}
            {items.length > 0 && (
              <div className="rounded-xl border border-gray-100 overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 bg-gray-50">
                      <th className="px-3 py-2 font-medium">Producto</th>
                      <th className="px-3 py-2 font-medium w-24">Cantidad</th>
                      <th className="px-3 py-2 font-medium w-32">Costo unit.</th>
                      <th className="px-3 py-2 font-medium text-right w-28">Subtotal</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i) => (
                      <tr key={i.inventoryVariantId} className="border-t border-gray-50">
                        <td className="px-3 py-2">
                          {i.name}
                          {colorLabel(i.color)}
                          {i.size ? ` · ${i.size}` : ''}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            value={i.quantity}
                            onChange={(e) =>
                              updateItem(i.inventoryVariantId, 'quantity', e.target.value)
                            }
                            className="w-20 rounded border border-gray-200 px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            value={i.unitCost}
                            onChange={(e) =>
                              updateItem(i.inventoryVariantId, 'unitCost', e.target.value)
                            }
                            placeholder="0"
                            className="w-28 rounded border border-gray-200 px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatCOP(
                            (Number(i.quantity) || 0) * (Number(i.unitCost) || 0)
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => removeItem(i.inventoryVariantId)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas (opcional)"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <div className="text-right">
                {responsableIVA && ivaTotal > 0 && (
                  <div className="text-xs text-gray-500">
                    <span className="mr-2">Base {formatCOP(total)}</span>
                    <span>
                      IVA ({defRate}%) {formatCOP(ivaTotal)}
                    </span>
                  </div>
                )}
                <span className="text-sm text-gray-500 mr-2">Total:</span>
                <span className="text-lg font-bold text-gray-800">
                  {formatCOP(responsableIVA ? grandTotal : total)}
                </span>
              </div>
              <Button
                variant="primary"
                onClick={handleCreate}
                disabled={loading || items.length === 0}
              >
                Registrar compra
              </Button>
            </div>
          </div>
        )}

        {/* Listado */}
        <div className="relative bg-white rounded-2xl shadow border border-gray-100">
          <LoadingOverlay show={loading} text="Cargando..." />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="px-5 py-3 font-medium">Compra</th>
                  <th className="px-5 py-3 font-medium">Proveedor</th>
                  <th className="px-5 py-3 font-medium text-center">Ítems</th>
                  <th className="px-5 py-3 font-medium text-right">Total</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-5 py-4">
                      <EmptyState title="Aún no hay compras." />
                    </td>
                  </tr>
                )}
                {purchases.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-orange-50">
                    <td className="px-5 py-3 font-medium text-gray-800">{p.code}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {p.provider?.name || '—'}
                    </td>
                    <td className="px-5 py-3 text-center">{p._count?.items ?? 0}</td>
                    <td className="px-5 py-3 text-right font-semibold">
                      {formatCOP(p.total)}
                    </td>
                    <td className="px-5 py-3">{statusBadge(p.status)}</td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                      {formatDateTime(p.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => openDetail(p.id)}
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
            <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between bg-gradient-to-r from-orange-600 to-[#111827] text-white px-6 py-4">
                <div>
                  <h2 className="text-lg font-bold">{detail.code}</h2>
                  <p className="text-sm opacity-80">
                    {detail.provider?.name || 'Sin proveedor'} ·{' '}
                    {statusBadge(detail.status)}
                  </p>
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
                      <th className="py-2 text-right">Costo</th>
                      <th className="py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items?.map((it) => (
                      <tr key={it.id} className="border-b border-gray-50">
                        <td className="py-2">
                          {it.variant?.inventory?.name}
                          {colorLabel(it.variant?.color)}
                          {showColor && it.variant?.size
                            ? ` · ${it.variant.size}`
                            : ''}
                        </td>
                        <td className="py-2 text-center">{it.quantity}</td>
                        <td className="py-2 text-right">{formatCOP(it.unitCost)}</td>
                        <td className="py-2 text-right">{formatCOP(it.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-right text-lg font-bold text-gray-800">
                  Total: {formatCOP(detail.total)}
                </div>
                {detail.notes && (
                  <p className="mt-2 text-sm text-gray-500">Notas: {detail.notes}</p>
                )}
              </div>
              {detail.status === 'PENDIENTE' && (
                <div className="border-t border-gray-100 p-4 flex justify-end gap-2">
                  <button
                    onClick={() => handleCancel(detail.id)}
                    disabled={loading}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Cancelar compra
                  </button>
                  <button
                    onClick={() => handleReceive(detail.id)}
                    disabled={loading}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 flex items-center gap-1"
                  >
                    <CheckCircleIcon className="w-5 h-5" /> Recibir (sumar stock)
                  </button>
                </div>
              )}
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
