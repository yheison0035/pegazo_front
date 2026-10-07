'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  XMarkIcon,
  BanknotesIcon,
  ArchiveBoxIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  TrashIcon,
  UserIcon,
  PlusIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import { useAuth } from '@/context/authContext';
import { formatCOP, formatDateSafe } from '@/lib/api/utils/utils';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { searchProducts } from '@/lib/api/routes/sales';
import {
  getLayaways,
  addLayawayPayment,
  updateLayawayItems,
  completeLayaway,
  cancelLayaway,
} from '@/lib/api/routes/layaway';

const PAY_METHODS = [
  { id: 'EFECTIVO', label: 'Efectivo' },
  { id: 'TRANSFERENCIA', label: 'Transferencia' },
  { id: 'DATAFONO', label: 'Datáfono' },
  { id: 'BANCOLOMBIA', label: 'Bancolombia' },
];

const inputCls =
  'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20';

// Buscador de productos para editar los ítems del apartado. Agrega filas
// {inventoryVariantId, name, color, size, quantity, price}.
function ProductPicker({ items, setItems }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await searchProducts(term);
        const list = (res?.data || res || []).filter((r) => r.type !== 'service');
        setResults(list);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const add = (r) => {
    setItems((prev) => {
      const found = prev.find((i) => i.inventoryVariantId === r.id);
      if (found)
        return prev.map((i) =>
          i.inventoryVariantId === r.id
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      return [
        ...prev,
        {
          inventoryVariantId: r.id,
          name: r.name,
          color: r.color,
          quantity: 1,
          price: r.price || 0,
        },
      ];
    });
    setQ('');
    setResults([]);
  };

  const setQty = (id, qty) =>
    setItems((prev) =>
      prev.map((i) =>
        i.inventoryVariantId === id
          ? { ...i, quantity: Math.max(1, Number(qty) || 1) }
          : i,
      ),
    );
  const setPrice = (id, price) =>
    setItems((prev) =>
      prev.map((i) =>
        i.inventoryVariantId === id
          ? { ...i, price: Number(String(price).replace(/[^\d]/g, '')) || 0 }
          : i,
      ),
    );
  const remove = (id) =>
    setItems((prev) => prev.filter((i) => i.inventoryVariantId !== id));

  return (
    <div className="space-y-2">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar producto para agregar…"
          className={`${inputCls} pl-9`}
        />
        {q.trim().length >= 2 && (
          <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
            {searching ? (
              <p className="px-3 py-2 text-xs text-gray-400">Buscando…</p>
            ) : results.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-400">Sin resultados.</p>
            ) : (
              results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => add(r)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-orange-50"
                >
                  <span className="min-w-0 truncate">
                    {r.name}
                    {r.color && r.color !== 'ÚNICO' ? (
                      <span className="text-gray-400"> · {r.color}</span>
                    ) : null}
                  </span>
                  <span className="flex-none font-semibold text-gray-700">
                    {formatCOP(r.price)}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {items.map((it) => (
        <div
          key={it.inventoryVariantId}
          className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2"
        >
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800">
            {it.name}
            {it.color && it.color !== 'ÚNICO' ? (
              <span className="text-gray-400"> · {it.color}</span>
            ) : null}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-gray-400">Cant.</span>
            <input
              type="number"
              min="1"
              value={it.quantity}
              onChange={(e) => setQty(it.inventoryVariantId, e.target.value)}
              className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-sm"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-gray-400">Precio</span>
            <input
              value={formatCOP(it.price)}
              onChange={(e) => setPrice(it.inventoryVariantId, e.target.value)}
              className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-sm"
            />
          </div>
          <span className="w-24 text-right text-sm font-bold tabular-nums text-gray-900">
            {formatCOP(it.price * it.quantity)}
          </span>
          <button
            onClick={() => remove(it.inventoryVariantId)}
            className="text-gray-300 hover:text-red-500"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function LayawayPage() {
  const { usuario } = useAuth();
  const isOwner = ['SUPER_ADMIN', 'ADMIN'].includes(usuario?.role);

  const [list, setList] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState({});

  // Filtros
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [target, setTarget] = useState(null); // plan seleccionado (gestionar)
  const [abono, setAbono] = useState({ amount: '', method: 'EFECTIVO' });
  const [editItems, setEditItems] = useState(null); // null = no editando

  const fetchList = useCallback(
    () =>
      getLayaways({
        customer: search.trim() || undefined,
        from: from || undefined,
        to: to || undefined,
      }),
    [search, from, to],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchList();
      setList(res?.data || []);
      setSummary(res?.summary || null);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [fetchList]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const doAbono = async () => {
    const amount = Number(String(abono.amount).replace(/[^\d]/g, '')) || 0;
    if (amount <= 0) {
      setAlert({ type: 'warning', message: 'Ingresa el valor del abono.' });
      return;
    }
    setBusy(true);
    try {
      const res = await addLayawayPayment(target.id, {
        amount,
        method: abono.method,
      });
      const settled = !!res?.data?.pagada;
      const fresh = await fetchList();
      setList(fresh?.data || []);
      setSummary(fresh?.summary || null);
      setAbono({ amount: '', method: 'EFECTIVO' });
      if (settled) {
        setTarget(null);
        setAlert({
          type: 'success',
          message:
            'Saldado y entregado. Stock descontado y pasó a Ventas realizadas.',
        });
      } else {
        const updated = (fresh?.data || []).find((l) => l.id === target.id);
        setTarget(updated || null);
      }
    } catch (e) {
      setAlert({ type: 'error', message: e?.message || 'No se pudo abonar.' });
    } finally {
      setBusy(false);
    }
  };

  const saveItems = async () => {
    if (!editItems?.length) {
      setAlert({ type: 'warning', message: 'Debe quedar al menos un producto.' });
      return;
    }
    setBusy(true);
    try {
      await updateLayawayItems(target.id, {
        items: editItems.map((i) => ({
          inventoryVariantId: i.inventoryVariantId,
          quantity: i.quantity,
          priceOverride: i.price,
        })),
      });
      const fresh = await fetchList();
      setList(fresh?.data || []);
      setSummary(fresh?.summary || null);
      const updated = (fresh?.data || []).find((l) => l.id === target.id);
      setTarget(updated || null);
      setEditItems(null);
      setAlert({ type: 'success', message: 'Productos actualizados.' });
    } catch (e) {
      setAlert({ type: 'error', message: e?.message || 'No se pudo guardar.' });
    } finally {
      setBusy(false);
    }
  };

  const doComplete = async () => {
    const force = target.saldo > 0;
    const msg = force
      ? `Este apartado aún tiene saldo (${formatCOP(
          target.saldo,
        )}). ¿Entregar de todas formas? Se descontará el stock.`
      : '¿Entregar este plan separe? Se descontará el stock y pasará a Ventas realizadas.';
    if (!window.confirm(msg)) return;
    setBusy(true);
    try {
      await completeLayaway(target.id, force ? { force: true } : {});
      setTarget(null);
      setAlert({
        type: 'success',
        message: 'Entregado. Stock descontado y pasó a Ventas realizadas.',
      });
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e?.message || 'No se pudo entregar.' });
    } finally {
      setBusy(false);
    }
  };

  const doCancel = async (l) => {
    if (!window.confirm(`¿Anular el plan separe ${l.code}? No descuenta stock.`))
      return;
    setBusy(true);
    try {
      await cancelLayaway(l.id);
      setTarget(null);
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e?.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <RoleGuard
      allowedRoles={[
        Roles.SUPER_ADMIN,
        Roles.ADMIN,
        Roles.RECEPCIONISTA,
        Roles.CAJA,
        Roles.ASESOR,
      ]}
    >
      <div className="w-full p-4">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-gray-800 sm:text-2xl">
            Planes separe
          </h1>
          <Link
            href="/dashboard/sales"
            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-orange-700"
          >
            <PlusIcon className="h-5 w-5" /> Nuevo plan separe
          </Link>
        </div>
        <p className="mb-5 text-sm text-gray-500">
          Los apartados se crean en{' '}
          <Link
            href="/dashboard/sales"
            className="font-semibold text-orange-600 hover:underline"
          >
            Realizar factura
          </Link>{' '}
          eligiendo el tipo <b>Plan separe</b>. Aquí se abonan y, al saldar, se
          entregan (descuentan stock) y pasan a Ventas realizadas.
        </p>

        {/* Resumen */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:max-w-xl">
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-xs font-semibold uppercase text-orange-700">
              Activos
            </p>
            <p className="mt-1 text-2xl font-extrabold text-orange-700">
              {summary?.active || 0}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-gray-500">
              Por cobrar (saldo)
            </p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">
              {formatCOP(summary?.totalBalance || 0)}
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-5 flex flex-wrap items-end gap-2">
          <div className="relative min-w-[200px] flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente o teléfono…"
              className={`${inputCls} pl-9`}
            />
          </div>
          <div>
            <label className="mb-0.5 block text-[11px] font-medium text-gray-500">
              Desde
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-0.5 block text-[11px] font-medium text-gray-500">
              Hasta
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={inputCls}
            />
          </div>
          {(search || from || to) && (
            <button
              onClick={() => {
                setSearch('');
                setFrom('');
                setTo('');
              }}
              className="rounded-xl px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100"
            >
              Limpiar
            </button>
          )}
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-gray-400">Cargando…</p>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-14 text-center">
            <ArchiveBoxIcon className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">
              No hay planes separe activos.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Crea uno en Realizar factura (tipo: Plan separe).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {list.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => {
                  setTarget(l);
                  setAbono({ amount: '', method: 'EFECTIVO' });
                  setEditItems(null);
                }}
                className="rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 font-semibold text-gray-800">
                      <UserIcon className="h-4 w-4 flex-none text-gray-400" />
                      {l.customer?.name || 'Sin cliente'}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {l.code} · {l.itemsCount || 0} productos ·{' '}
                      {formatDateSafe(l.saleDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400">
                      Saldo
                    </p>
                    <p className="text-xl font-extrabold text-gray-900">
                      {formatCOP(l.saldo)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-2 text-[11px] text-gray-500">
                  <span>Total {formatCOP(l.total)}</span>
                  <span className="text-emerald-600">
                    Abonado {formatCOP(l.paid)}
                  </span>
                  {l.saldo <= 0 && (
                    <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">
                      Listo para entregar
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* MODAL GESTIONAR */}
        {target && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-3 pt-[6vh] backdrop-blur-sm"
            onClick={() => {
              setTarget(null);
              setEditItems(null);
            }}
          >
            <div
              className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">
                    {target.customer?.name || 'Sin cliente'}
                  </h2>
                  <button
                    onClick={() => {
                      setTarget(null);
                      setEditItems(null);
                    }}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-full bg-white/15 px-2.5 py-1 font-semibold">
                    {target.code}
                  </span>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 font-semibold">
                    Total {formatCOP(target.total)}
                  </span>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 font-semibold">
                    Abonado {formatCOP(target.paid)}
                  </span>
                  <span className="rounded-full bg-white/25 px-2.5 py-1 font-bold">
                    Saldo {formatCOP(target.saldo)}
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                {/* Productos */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Productos
                    </p>
                    {editItems === null ? (
                      (target.items || []).every((i) => i.inventoryVariantId) && (
                        <button
                          onClick={() =>
                            setEditItems(
                              (target.items || []).map((i) => ({
                                inventoryVariantId: i.inventoryVariantId,
                                name: i.name,
                                color: i.color,
                                quantity: i.quantity,
                                price: i.price,
                              })),
                            )
                          }
                          className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline"
                        >
                          <PencilSquareIcon className="h-3.5 w-3.5" /> Editar
                        </button>
                      )
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditItems(null)}
                          className="text-xs font-semibold text-gray-500"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={saveItems}
                          disabled={busy}
                          className="text-xs font-semibold text-orange-600 disabled:opacity-50"
                        >
                          Guardar
                        </button>
                      </div>
                    )}
                  </div>

                  {editItems === null ? (
                    <ul className="space-y-1">
                      {(target.items || []).map((i) => (
                        <li
                          key={i.id}
                          className="flex items-center justify-between gap-2 text-sm"
                        >
                          <span className="min-w-0 truncate text-gray-700">
                            {i.name}
                            {i.color && i.color !== 'ÚNICO' ? (
                              <span className="text-gray-400"> · {i.color}</span>
                            ) : null}
                            {i.size ? (
                              <span className="text-gray-400"> · {i.size}</span>
                            ) : null}{' '}
                            <span className="text-gray-400">×{i.quantity}</span>
                          </span>
                          <span className="flex-none font-semibold tabular-nums text-gray-900">
                            {formatCOP(i.subtotal)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <>
                      <ProductPicker items={editItems} setItems={setEditItems} />
                      <p className="mt-1.5 text-[11px] text-gray-400">
                        No puede quedar por debajo de lo ya abonado (
                        {formatCOP(target.paid)}).
                      </p>
                    </>
                  )}
                </div>

                {/* Abonos */}
                {editItems === null && target.saldo > 0 && (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Registrar abono
                    </p>
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="flex-1">
                        <input
                          value={abono.amount}
                          onChange={(e) =>
                            setAbono((s) => ({
                              ...s,
                              amount: e.target.value.replace(/[^\d]/g, ''),
                            }))
                          }
                          placeholder={`Saldo ${formatCOP(target.saldo)}`}
                          inputMode="numeric"
                          className={inputCls}
                        />
                      </div>
                      <select
                        value={abono.method}
                        onChange={(e) =>
                          setAbono((s) => ({ ...s, method: e.target.value }))
                        }
                        className={`${inputCls} w-auto`}
                      >
                        {PAY_METHODS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={doAbono}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <BanknotesIcon className="h-4 w-4" /> Abonar
                      </button>
                    </div>
                    <p className="mt-1.5 text-[11px] text-gray-400">
                      Si el abono salda el total, se entrega automáticamente.
                    </p>
                  </div>
                )}

                {/* Historial de abonos */}
                {target.payments?.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Abonos
                    </p>
                    <ul className="space-y-1">
                      {target.payments.map((p) => (
                        <li
                          key={p.id}
                          className="flex items-center justify-between text-xs text-gray-500"
                        >
                          <span>
                            {formatDateSafe(p.paidAt)} · {p.method}
                            {p.by ? ` · ${p.by}` : ''}
                          </span>
                          <span className="font-semibold text-emerald-600">
                            {formatCOP(p.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-6 py-4">
                {isOwner && (
                  <button
                    onClick={() => doCancel(target)}
                    disabled={busy}
                    className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" /> Anular
                  </button>
                )}
                <button
                  onClick={doComplete}
                  disabled={busy || editItems !== null}
                  title="Entregar y descontar stock"
                  className="ml-auto inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  {target.saldo > 0 ? 'Entregar ahora' : 'Entregar'}
                </button>
              </div>
            </div>
          </div>
        )}

        <AlertModal
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({})}
        />
      </div>
    </RoleGuard>
  );
}
