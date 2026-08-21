'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  UserIcon,
  XMarkIcon,
  GiftIcon,
  ShoppingBagIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import { useAuth } from '@/context/authContext';
import useTerms from '@/hooks/useTerms';
import useSales from '@/lib/api/hooks/useSales';
import useUsers from '@/lib/api/hooks/useUsers';
import useLocals from '@/lib/api/hooks/useLocals';
import { getCustomers, getCustomerSummary } from '@/lib/api/routes/customers';
import { formatCOP } from '@/lib/api/utils/utils';
import AlertModal from '@/components/dashboard/modals/alertModal';

const PAYMENT_METHODS = [
  { id: 'EFECTIVO', name: 'Efectivo' },
  { id: 'BANCOLOMBIA', name: 'Bancolombia' },
  { id: 'TRANSFERENCIA', name: 'Transferencia' },
  { id: 'DATAFONO', name: 'Datáfono' },
  { id: 'ADDI', name: 'Addi' },
  { id: 'CREDITO', name: 'Crédito / Fiado' },
];

const keyOf = (r) => (r.type === 'service' ? `s${r.id}` : `p${r.id}`);

export default function POS() {
  const { usuario } = useAuth();
  const t = useTerms();
  const { searchProducts, createSale, loading } = useSales();
  const { getUsers } = useUsers();
  const { getLocals } = useLocals();

  // Catálogo / búsqueda
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);

  // Carrito
  const [cart, setCart] = useState([]);

  // Cliente
  const [customer, setCustomer] = useState(null); // {id,name,...,loyalty}
  const [custSearch, setCustSearch] = useState('');
  const [custResults, setCustResults] = useState([]);

  // Config de la venta
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [notes, setNotes] = useState('');
  const [locals, setLocals] = useState([]);
  const [localId, setLocalId] = useState(usuario?.localId || '');
  const [sellers, setSellers] = useState([]);
  const [sellerId, setSellerId] = useState(usuario?.id || '');

  const [alert, setAlert] = useState({ type: '', message: '', url: '' });

  // Cargar sedes y vendedores/atendedores.
  useEffect(() => {
    (async () => {
      try {
        const l = await getLocals({ all: true });
        const list = l?.data || [];
        setLocals(list);
        if (!localId && list.length) setLocalId(String(list[0].id));
      } catch (_) {}
      try {
        const u = await getUsers({ status: 'ACTIVO', limit: 1000 });
        setSellers(u?.data || []);
      } catch (_) {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Buscador de productos/servicios (debounced).
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const to = setTimeout(async () => {
      try {
        const res = await searchProducts(term);
        setResults(res?.data || res || []);
      } catch (_) {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(to);
  }, [query, searchProducts]);

  // Buscador de clientes.
  useEffect(() => {
    const term = custSearch.trim();
    if (term.length < 2 || customer) {
      setCustResults([]);
      return;
    }
    const to = setTimeout(async () => {
      try {
        const res = await getCustomers({ name: term, limit: 6 });
        setCustResults(res?.data || []);
      } catch (_) {
        setCustResults([]);
      }
    }, 250);
    return () => clearTimeout(to);
  }, [custSearch, customer]);

  const addToCart = useCallback((r) => {
    const key = keyOf(r);
    setCart((prev) => {
      const found = prev.find((i) => i.key === key);
      if (found) {
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          key,
          type: r.type === 'service' ? 'service' : 'product',
          refId: r.id,
          name: r.name,
          color: r.color,
          size: r.size,
          stock: r.stock,
          price: r.price || 0,
          quantity: 1,
          discount: 0,
        },
      ];
    });
  }, []);

  const setQty = (key, q) =>
    setCart((prev) =>
      prev.map((i) =>
        i.key === key ? { ...i, quantity: Math.max(1, q) } : i
      )
    );
  const setDiscount = (key, d) =>
    setCart((prev) =>
      prev.map((i) => (i.key === key ? { ...i, discount: Math.max(0, d) } : i))
    );
  const removeItem = (key) =>
    setCart((prev) => prev.filter((i) => i.key !== key));

  const pickCustomer = async (c) => {
    setCustomer(c);
    setCustResults([]);
    setCustSearch('');
    // Traer estado de fidelización para sugerir el descuento.
    try {
      const res = await getCustomerSummary(c.id);
      const loyalty = res?.data?.loyalty;
      if (loyalty?.enabled) setCustomer({ ...c, loyalty });
    } catch (_) {}
  };

  // Aplica el descuento de fidelización del cliente a las líneas de servicio.
  const applyLoyalty = () => {
    const pct = customer?.loyalty?.nextDiscount || 0;
    if (!pct) return;
    setCart((prev) =>
      prev.map((i) =>
        i.type === 'service'
          ? { ...i, discount: Math.round(i.price * i.quantity * (pct / 100)) }
          : i
      )
    );
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountTotal = cart.reduce(
    (s, i) => s + Math.min(i.discount, i.price * i.quantity),
    0
  );
  const total = subtotal - discountTotal;
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  const clearAll = () => {
    setCart([]);
    setCustomer(null);
    setNotes('');
    setPaymentMethod('EFECTIVO');
  };

  const submit = async () => {
    if (cart.length === 0) {
      setAlert({ type: 'error', message: 'Agrega al menos un ítem.' });
      return;
    }
    if (!localId) {
      setAlert({ type: 'error', message: 'Selecciona la sede.' });
      return;
    }
    try {
      await createSale({
        paymentMethod,
        paymentStatus: paymentMethod === 'CREDITO' ? 'FIADO' : 'PAGADA',
        localId: Number(localId),
        userId: Number(sellerId) || usuario?.id,
        customerId: customer?.id,
        notes,
        items: cart.map((i) =>
          i.type === 'service'
            ? {
                serviceId: i.refId,
                quantity: i.quantity,
                discount: Math.round(i.discount) || 0,
              }
            : {
                inventoryVariantId: i.refId,
                quantity: i.quantity,
                discount: Math.round(i.discount) || 0,
              }
        ),
      });
      setAlert({
        type: 'success',
        message: 'Factura registrada correctamente.',
        url: '/dashboard/delivered_sales',
      });
      clearAll();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Error al facturar' });
    }
  };

  // Los servicios se listan por sede (precio propio). Mostramos solo los de la
  // sede seleccionada para no cruzar precios.
  const shownResults = results.filter(
    (r) =>
      r.type !== 'service' ||
      !r.localId ||
      String(r.localId) === String(localId)
  );

  const variantLabel = (i) =>
    [i.color && i.color !== 'ÚNICO' ? i.color : null, i.size]
      .filter(Boolean)
      .join(' · ');

  return (
    <RoleGuard allowedRoles={Object.values(Roles)}>
      <div className="w-full p-3 sm:p-4 pb-24 lg:pb-4">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Realizar Factura
          </h1>
          {locals.length > 1 && (
            <select
              value={localId}
              onChange={(e) => setLocalId(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {locals.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* ================= IZQUIERDA: BUSCADOR + CATÁLOGO ================= */}
          <div className="lg:flex-1 min-w-0">
            <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 focus-within:ring-2 focus-within:ring-orange-500">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                <input
                  ref={searchRef}
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && shownResults[0]) {
                      addToCart(shownResults[0]);
                      setQuery('');
                    }
                  }}
                  placeholder={`Buscar ${t.productPlural?.toLowerCase() || 'productos'} o ${t.servicePlural?.toLowerCase() || 'servicios'} (nombre o código)`}
                  className="flex-1 text-sm focus:outline-none"
                />
                {query && (
                  <button onClick={() => setQuery('')}>
                    <XMarkIcon className="w-5 h-5 text-gray-400" />
                  </button>
                )}
              </div>

              {/* Resultados */}
              <div className="mt-3">
                {query.trim().length < 2 ? (
                  <div className="py-12 text-center text-gray-400 text-sm">
                    <ShoppingBagIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    Escribe para buscar y toca un ítem para agregarlo a la
                    factura.
                  </div>
                ) : searching && shownResults.length === 0 ? (
                  <p className="py-8 text-center text-gray-400 text-sm">
                    Buscando...
                  </p>
                ) : shownResults.length === 0 ? (
                  <p className="py-8 text-center text-gray-400 text-sm">
                    Sin resultados para “{query}”.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                    {shownResults.map((r) => {
                      const isService = r.type === 'service';
                      const noStock = !isService && r.stock <= 0;
                      return (
                        <button
                          key={`${r.type}-${r.id}`}
                          onClick={() => addToCart(r)}
                          disabled={noStock}
                          className={`group flex flex-col rounded-xl border p-3 text-left transition ${
                            noStock
                              ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                              : 'border-gray-200 hover:border-orange-400 hover:bg-orange-50/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400">
                              {isService ? (
                                <WrenchScrewdriverIcon className="w-3.5 h-3.5" />
                              ) : (
                                <ShoppingBagIcon className="w-3.5 h-3.5" />
                              )}
                              {isService ? t.service : t.product}
                            </span>
                            <PlusIcon className="w-4 h-4 text-orange-500 opacity-0 group-hover:opacity-100" />
                          </div>
                          <span className="mt-1 line-clamp-2 text-sm font-medium text-gray-800">
                            {r.name}
                            {variantLabel(r) ? (
                              <span className="text-gray-400">
                                {' '}
                                · {variantLabel(r)}
                              </span>
                            ) : null}
                          </span>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-800">
                              {formatCOP(r.price)}
                            </span>
                            {!isService && (
                              <span
                                className={`text-[11px] ${
                                  noStock ? 'text-red-500' : 'text-gray-400'
                                }`}
                              >
                                {noStock ? 'Sin stock' : `Stock: ${r.stock}`}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ================= DERECHA: FACTURA ================= */}
          <div className="lg:w-[400px] lg:flex-none">
            <div className="lg:sticky lg:top-4 rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col max-h-[calc(100vh-2rem)]">
              {/* Cliente */}
              <div className="p-3 border-b border-gray-100">
                {customer ? (
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1 text-sm font-medium text-gray-800 truncate">
                        <UserIcon className="w-4 h-4 flex-none text-gray-400" />
                        {customer.name}
                      </p>
                      {customer.phone && (
                        <p className="text-xs text-gray-400">{customer.phone}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setCustomer(null)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2">
                      <UserIcon className="w-4 h-4 text-gray-400" />
                      <input
                        value={custSearch}
                        onChange={(e) => setCustSearch(e.target.value)}
                        placeholder="Cliente (opcional) — Consumidor Final"
                        className="flex-1 text-sm focus:outline-none"
                      />
                    </div>
                    {custResults.length > 0 && (
                      <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-56 overflow-y-auto">
                        {custResults.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => pickCustomer(c)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-orange-50"
                          >
                            {c.name}{' '}
                            <span className="text-gray-400">{c.phone || ''}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Fidelización: descuento disponible */}
                {customer?.loyalty?.nextDiscount > 0 && (
                  <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-800">
                      <GiftIcon className="w-4 h-4" />
                      Fidelización: {customer.loyalty.nextDiscount}% en{' '}
                      {t.service?.toLowerCase() || 'el servicio'}
                    </span>
                    <button
                      onClick={applyLoyalty}
                      className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Aplicar
                    </button>
                  </div>
                )}
              </div>

              {/* Ítems */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[120px]">
                {cart.length === 0 ? (
                  <p className="py-10 text-center text-sm text-gray-400">
                    La factura está vacía. Agrega ítems desde la izquierda.
                  </p>
                ) : (
                  cart.map((i) => {
                    const line = i.price * i.quantity - Math.min(i.discount, i.price * i.quantity);
                    return (
                      <div
                        key={i.key}
                        className="rounded-xl border border-gray-100 p-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-gray-800">
                            {i.name}
                            {variantLabel(i) ? (
                              <span className="text-gray-400"> · {variantLabel(i)}</span>
                            ) : null}
                          </p>
                          <button
                            onClick={() => removeItem(i.key)}
                            className="text-gray-300 hover:text-red-500"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          {/* Stepper de cantidad */}
                          <div className="flex items-center rounded-lg border border-gray-200">
                            <button
                              onClick={() => setQty(i.key, i.quantity - 1)}
                              className="px-2 py-1 text-gray-500 hover:bg-gray-50"
                            >
                              <MinusIcon className="w-4 h-4" />
                            </button>
                            <input
                              value={i.quantity}
                              onChange={(e) =>
                                setQty(i.key, Number(e.target.value.replace(/[^\d]/g, '')) || 1)
                              }
                              className="w-10 text-center text-sm focus:outline-none"
                            />
                            <button
                              onClick={() => setQty(i.key, i.quantity + 1)}
                              className="px-2 py-1 text-gray-500 hover:bg-gray-50"
                            >
                              <PlusIcon className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="text-xs text-gray-400">
                            {formatCOP(i.price)} c/u
                          </span>
                          <span className="text-sm font-semibold text-gray-800">
                            {formatCOP(line)}
                          </span>
                        </div>
                        {/* Descuento por línea */}
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-[11px] text-gray-400">Descuento $</span>
                          <input
                            value={i.discount ? formatCOP(i.discount) : ''}
                            onChange={(e) =>
                              setDiscount(
                                i.key,
                                Number(e.target.value.replace(/[^\d]/g, '')) || 0
                              )
                            }
                            placeholder="0"
                            className="w-24 rounded border border-gray-200 px-2 py-0.5 text-xs focus:outline-none"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Totales + pago + cobrar */}
              <div className="border-t border-gray-100 p-3 space-y-3">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span>{formatCOP(subtotal)}</span>
                  </div>
                  {discountTotal > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Descuentos</span>
                      <span>− {formatCOP(discountTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-gray-800">
                    <span>Total</span>
                    <span>{formatCOP(total)}</span>
                  </div>
                </div>

                {/* Atendido por (vendedor/barbero) */}
                {sellers.length > 0 && (
                  <div>
                    <label className="text-[11px] font-medium text-gray-500">
                      {t.attendant || 'Atendido por'}
                    </label>
                    <select
                      value={sellerId}
                      onChange={(e) => setSellerId(e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {sellers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Método de pago */}
                <div className="grid grid-cols-3 gap-1.5">
                  {PAYMENT_METHODS.map((pm) => (
                    <button
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`rounded-lg px-2 py-1.5 text-xs font-medium border transition ${
                        paymentMethod === pm.id
                          ? 'border-orange-400 bg-orange-50 text-orange-700'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pm.name}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  {cart.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      Limpiar
                    </button>
                  )}
                  <button
                    onClick={submit}
                    disabled={loading || cart.length === 0}
                    className="flex-1 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                  >
                    {loading
                      ? 'Procesando...'
                      : `Cobrar ${formatCOP(total)}${
                          itemCount ? ` · ${itemCount} ít.` : ''
                        }`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AlertModal
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: '', message: '', url: '' })}
          url={alert.url}
        />
      </div>
    </RoleGuard>
  );
}
