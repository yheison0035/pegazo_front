'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowRightCircleIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { Roles, ALL_EXCEPT_BARBER } from '@/config/roles';
import { useAuth } from '@/context/authContext';
import useQuotes from '@/lib/api/hooks/useQuotes';
import useSales from '@/lib/api/hooks/useSales';
import useLocals from '@/lib/api/hooks/useLocals';
import { getCustomers } from '@/lib/api/routes/customers';
import { formatCOP, formatDateTime } from '@/lib/api/utils/utils';
import Pagination from '@/components/dashboard/tables/segments/pagination';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import AlertModal from '@/components/dashboard/modals/alertModal';
import Button from '@/components/ui/Button';

const statusBadge = (s) => <StatusBadge status={s} />;

export default function QuotesPage() {
  const { usuario } = useAuth();
  const {
    getQuotes,
    getQuoteById,
    createQuote,
    acceptQuote,
    rejectQuote,
    convertQuote,
    deleteQuote,
    loading,
  } = useQuotes();
  const { searchProducts } = useSales();
  const { getLocals } = useLocals();

  const [quotes, setQuotes] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const [showForm, setShowForm] = useState(false);
  const [detail, setDetail] = useState(null);
  const [locals, setLocals] = useState([]);

  // formulario
  const [localId, setLocalId] = useState(usuario?.localId || '');
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  // cliente
  const [customer, setCustomer] = useState(null);
  const [custSearch, setCustSearch] = useState('');
  const [custResults, setCustResults] = useState([]);

  const fetchQuotes = useCallback(async () => {
    try {
      const res = await getQuotes({ page, limit });
      setQuotes(res.data || []);
      setMeta(res.meta || null);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Error al cargar' });
    }
  }, [getQuotes, page, limit]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  useEffect(() => {
    (async () => {
      try {
        const l = await getLocals({ all: true });
        const list = l?.data || [];
        setLocals(list);
        if (!localId && list.length) setLocalId(String(list[0].id));
      } catch (_) {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // buscador de productos/servicios
  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await searchProducts(term);
        setResults(res?.data || res || []);
      } catch (_) {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search, searchProducts]);

  // buscador de clientes
  useEffect(() => {
    const term = custSearch.trim();
    if (term.length < 2) {
      setCustResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await getCustomers({ name: term, limit: 8 });
        setCustResults(res?.data || []);
      } catch (_) {
        setCustResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [custSearch]);

  const addItem = (r) => {
    const key = r.type === 'service' ? `s${r.id}` : `p${r.id}`;
    if (items.some((i) => i.key === key)) return;
    setItems((prev) => [
      ...prev,
      {
        key,
        inventoryVariantId: r.type === 'service' ? null : r.id,
        serviceId: r.type === 'service' ? r.id : null,
        name: r.name,
        color: r.color,
        size: r.size,
        quantity: 1,
        price: r.price || 0,
      },
    ]);
    setSearch('');
    setResults([]);
  };

  const updateItem = (key, field, value) =>
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, [field]: value } : i))
    );
  const removeItem = (key) =>
    setItems((prev) => prev.filter((i) => i.key !== key));

  const total = items.reduce(
    (s, i) => s + (Number(i.quantity) || 0) * (Number(i.price) || 0),
    0
  );

  const resetForm = () => {
    setItems([]);
    setNotes('');
    setValidUntil('');
    setSearch('');
    setResults([]);
    setCustomer(null);
    setCustSearch('');
    setShowForm(false);
  };

  const handleCreate = async () => {
    if (!localId || items.length === 0) {
      setAlert({ type: 'error', message: 'Agrega al menos un ítem.' });
      return;
    }
    try {
      await createQuote({
        localId: Number(localId),
        customerId: customer?.id,
        notes,
        validUntil: validUntil || undefined,
        items: items.map((i) => ({
          inventoryVariantId: i.inventoryVariantId || undefined,
          serviceId: i.serviceId || undefined,
          name: i.name,
          quantity: Number(i.quantity) || 0,
          price: Number(i.price) || 0,
        })),
      });
      setAlert({ type: 'success', message: 'Cotización creada.' });
      resetForm();
      fetchQuotes();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'No se pudo crear' });
    }
  };

  const openDetail = async (id) => {
    try {
      const res = await getQuoteById(id);
      setDetail(res.data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const doAction = async (fn, id, okMsg) => {
    try {
      await fn(id);
      setAlert({ type: 'success', message: okMsg });
      setDetail(null);
      fetchQuotes();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Error' });
    }
  };

  const handleConvert = async (id) => {
    try {
      await convertQuote(id, { paymentMethod: 'EFECTIVO' });
      setAlert({
        type: 'success',
        message: 'Cotización convertida en venta.',
      });
      setDetail(null);
      fetchQuotes();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'No se pudo convertir' });
    }
  };

  return (
    <RoleGuard allowedRoles={ALL_EXCEPT_BARBER}>
      <div className="w-full p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Cotizaciones</h1>
            <p className="text-sm text-gray-500">
              Presupuestos para tus clientes. Conviértelos en venta con un clic.
            </p>
          </div>
          {!showForm && (
            <Button variant="add" icon={PlusIcon} onClick={() => setShowForm(true)}>
              Nueva cotización
            </Button>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Nueva cotización
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-700">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
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
              {/* Cliente */}
              <div className="relative">
                <label className="text-xs font-medium text-gray-600">
                  Cliente (opcional)
                </label>
                {customer ? (
                  <div className="mt-1 flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <span>{customer.name}</span>
                    <button
                      onClick={() => setCustomer(null)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      value={custSearch}
                      onChange={(e) => setCustSearch(e.target.value)}
                      placeholder="Buscar cliente por nombre"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    {custResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {custResults.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setCustomer(c);
                              setCustSearch('');
                              setCustResults([]);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-orange-50 text-sm"
                          >
                            {c.name}{' '}
                            <span className="text-gray-400">{c.phone || ''}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">
                  Válida hasta (opcional)
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Buscador de productos/servicios */}
            <div className="relative mb-4">
              <label className="text-xs font-medium text-gray-600">
                Agregar producto o servicio
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
                      key={`${r.type}-${r.id}`}
                      onClick={() => addItem(r)}
                      className="w-full text-left px-3 py-2 hover:bg-orange-50 text-sm flex justify-between"
                    >
                      <span>
                        {r.type === 'service' ? '🛠 ' : ''}
                        {r.name}
                        {r.color && r.color !== 'ÚNICO' ? ` · ${r.color}` : ''}
                        {r.size ? ` · ${r.size}` : ''}
                      </span>
                      <span className="text-gray-400">{formatCOP(r.price)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="rounded-xl border border-gray-100 overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 bg-gray-50">
                      <th className="px-3 py-2 font-medium">Ítem</th>
                      <th className="px-3 py-2 font-medium w-24">Cantidad</th>
                      <th className="px-3 py-2 font-medium w-32">Precio</th>
                      <th className="px-3 py-2 font-medium text-right w-28">Subtotal</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i) => (
                      <tr key={i.key} className="border-t border-gray-50">
                        <td className="px-3 py-2">
                          {i.name}
                          {i.color && i.color !== 'ÚNICO' ? ` · ${i.color}` : ''}
                          {i.size ? ` · ${i.size}` : ''}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            value={i.quantity}
                            onChange={(e) => updateItem(i.key, 'quantity', e.target.value)}
                            className="w-20 rounded border border-gray-200 px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            value={i.price}
                            onChange={(e) => updateItem(i.key, 'price', e.target.value)}
                            className="w-28 rounded border border-gray-200 px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatCOP(
                            (Number(i.quantity) || 0) * (Number(i.price) || 0)
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => removeItem(i.key)}
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
                <span className="text-sm text-gray-500 mr-2">Total:</span>
                <span className="text-lg font-bold text-gray-800">
                  {formatCOP(total)}
                </span>
              </div>
              <Button
                variant="primary"
                onClick={handleCreate}
                disabled={loading || items.length === 0}
              >
                Crear cotización
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
                  <th className="px-5 py-3 font-medium">Cotización</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium text-center">Ítems</th>
                  <th className="px-5 py-3 font-medium text-right">Total</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {quotes.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-5 py-4">
                      <EmptyState title="Aún no hay cotizaciones." />
                    </td>
                  </tr>
                )}
                {quotes.map((q) => (
                  <tr key={q.id} className="border-b border-gray-50 hover:bg-orange-50">
                    <td className="px-5 py-3 font-medium text-gray-800">{q.code}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {q.customer?.name || '—'}
                    </td>
                    <td className="px-5 py-3 text-center">{q._count?.items ?? 0}</td>
                    <td className="px-5 py-3 text-right font-semibold">
                      {formatCOP(q.total)}
                    </td>
                    <td className="px-5 py-3">{statusBadge(q.status)}</td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                      {formatDateTime(q.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => openDetail(q.id)}
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
                    {detail.customer?.name || 'Sin cliente'} · {statusBadge(detail.status)}
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
                      <th className="py-2">Ítem</th>
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
                <div className="text-right text-lg font-bold text-gray-800">
                  Total: {formatCOP(detail.total)}
                </div>
                {detail.validUntil && (
                  <p className="mt-2 text-sm text-gray-500">
                    Válida hasta: {formatDateTime(detail.validUntil)}
                  </p>
                )}
                {detail.notes && (
                  <p className="mt-1 text-sm text-gray-500">Notas: {detail.notes}</p>
                )}
                {detail.status === 'CONVERTIDA' && (
                  <p className="mt-2 text-sm text-green-600 font-medium">
                    Ya facturada (venta #{detail.saleId}).
                  </p>
                )}
              </div>
              {detail.status !== 'CONVERTIDA' && (
                <div className="border-t border-gray-100 p-4 flex flex-wrap justify-end gap-2">
                  <button
                    onClick={() => doAction(deleteQuote, detail.id, 'Cotización eliminada.')}
                    disabled={loading}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Eliminar
                  </button>
                  {detail.status !== 'RECHAZADA' && (
                    <button
                      onClick={() => doAction(rejectQuote, detail.id, 'Cotización rechazada.')}
                      disabled={loading}
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Rechazar
                    </button>
                  )}
                  {detail.status === 'PENDIENTE' && (
                    <button
                      onClick={() => doAction(acceptQuote, detail.id, 'Cotización aceptada.')}
                      disabled={loading}
                      className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                    >
                      Aceptar
                    </button>
                  )}
                  <button
                    onClick={() => handleConvert(detail.id)}
                    disabled={loading}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 flex items-center gap-1"
                  >
                    <ArrowRightCircleIcon className="w-5 h-5" /> Convertir en venta
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
