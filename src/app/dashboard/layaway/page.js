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
  PrinterIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import { useAuth } from '@/context/authContext';
import { formatCOP, formatDateSafe } from '@/lib/api/utils/utils';
import AlertModal from '@/components/dashboard/modals/alertModal';
import useLiveRefresh from '@/hooks/useLiveRefresh';
import useDeliveredSales from '@/lib/api/hooks/useDeliveredSales';
import { printSaleInvoice } from '@/utils/printInvoice';
import {
  getLayaways,
  addLayawayPayment,
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

export default function LayawayPage() {
  const { usuario } = useAuth();
  const { getDeliveredSaleById } = useDeliveredSales();
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

  // Valor del abono en número + saldo que quedaría tras aplicarlo (para el
  // formato en pesos y la vista previa del modal).
  const abonoNum = Number(String(abono.amount).replace(/[^\d]/g, '')) || 0;
  const saldoAfter = target ? Math.max(0, target.saldo - abonoNum) : 0;

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
    try {
      const res = await fetchList();
      setList(res?.data || []);
      setSummary(res?.summary || null);
      // Si hay un plan abierto, refresca su contenido en vivo.
      setTarget((t) =>
        t ? (res?.data || []).find((l) => l.id === t.id) || null : t,
      );
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [fetchList]);

  // Carga con debounce al cambiar filtros.
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  // Datos en vivo: se refresca por eventos del backend y al volver el foco.
  useLiveRefresh(load);

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
      setAbono({ amount: '', method: 'EFECTIVO' });
      await load();
      if (settled) {
        setTarget(null);
        setAlert({
          type: 'success',
          message:
            'Saldado y entregado. Stock descontado y pasó a Ventas realizadas.',
        });
      }
    } catch (e) {
      setAlert({ type: 'error', message: e?.message || 'No se pudo abonar.' });
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

  // Imprime la factura del plan separe (marcada PLAN SEPARE, con abonado/saldo).
  const printPlan = async (l) => {
    try {
      const { data } = await getDeliveredSaleById(l.id);
      printSaleInvoice(data, usuario, { paid: l.paid, saldo: l.saldo });
    } catch (e) {
      setAlert({ type: 'error', message: e?.message || 'No se pudo imprimir.' });
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
            Plan separe
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
          eligiendo el tipo <b>Plan separe</b>. Aquí se abonan, se editan, se
          imprimen y, al saldar, se entregan (descuentan stock) pasando a Ventas
          realizadas.
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
              No hay ningún plan separe activo.
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
            onClick={() => setTarget(null)}
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
                  <button onClick={() => setTarget(null)}>
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
                {/* Productos + acciones */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Productos
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => printPlan(target)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800"
                      >
                        <PrinterIcon className="h-3.5 w-3.5" /> Imprimir
                      </button>
                      <Link
                        href={`/dashboard/layaway/edit/${target.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline"
                      >
                        <PencilSquareIcon className="h-3.5 w-3.5" /> Editar
                      </Link>
                    </div>
                  </div>
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
                </div>

                {/* Registrar abono */}
                {target.saldo > 0 && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
                        <BanknotesIcon className="h-4 w-4 text-emerald-600" />
                        Registrar abono
                      </p>
                      <span className="text-[11px] text-gray-400">
                        Saldo{' '}
                        <b className="text-gray-700">
                          {formatCOP(target.saldo)}
                        </b>
                      </span>
                    </div>

                    {/* Monto (formato en pesos, como el resto de campos) */}
                    <label className="mb-1 block text-[11px] font-medium text-gray-500">
                      Monto del abono
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-300">
                        $
                      </span>
                      <input
                        value={
                          abonoNum ? formatCOP(abonoNum).replace(/[^\d.,]/g, '') : ''
                        }
                        onChange={(e) =>
                          setAbono((s) => ({
                            ...s,
                            amount: e.target.value.replace(/[^\d]/g, ''),
                          }))
                        }
                        placeholder="0"
                        inputMode="numeric"
                        className="w-full rounded-xl border border-gray-200 py-2.5 pl-8 pr-3 text-lg font-bold tabular-nums text-gray-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    {/* Atajos de monto */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setAbono((s) => ({
                            ...s,
                            amount: String(Math.round(target.saldo)),
                          }))
                        }
                        className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        Saldar todo · {formatCOP(target.saldo)}
                      </button>
                      {[20000, 50000, 100000]
                        .filter((v) => v < target.saldo)
                        .map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() =>
                              setAbono((s) => ({ ...s, amount: String(v) }))
                            }
                            className="rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-200"
                          >
                            {formatCOP(v)}
                          </button>
                        ))}
                    </div>

                    {/* Método de pago (pills) */}
                    <label className="mb-1 mt-3 block text-[11px] font-medium text-gray-500">
                      Método de pago
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {PAY_METHODS.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() =>
                            setAbono((s) => ({ ...s, method: m.id }))
                          }
                          className={`rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition ${
                            abono.method === m.id
                              ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>

                    {/* Vista previa del saldo tras el abono */}
                    {abonoNum > 0 && (
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm">
                        <span className="text-gray-500">Saldo tras el abono</span>
                        <span
                          className={`font-bold tabular-nums ${
                            saldoAfter === 0
                              ? 'text-emerald-600'
                              : 'text-gray-900'
                          }`}
                        >
                          {formatCOP(saldoAfter)}
                        </span>
                      </div>
                    )}

                    <button
                      onClick={doAbono}
                      disabled={busy || abonoNum <= 0}
                      className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <BanknotesIcon className="h-4 w-4" />
                      {saldoAfter === 0 && abonoNum > 0
                        ? 'Abonar y entregar'
                        : 'Registrar abono'}
                    </button>
                    <p className="mt-1.5 text-center text-[11px] text-gray-400">
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
                  disabled={busy}
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
