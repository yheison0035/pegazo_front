'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PlusIcon,
  XMarkIcon,
  BanknotesIcon,
  Cog6ToothIcon,
  ClockIcon,
  SparklesIcon,
  CheckCircleIcon,
  UserIcon,
  ArchiveBoxIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import { useAuth } from '@/context/authContext';
import Button from '@/components/ui/Button';
import MoneyInput from '@/components/ui/MoneyInput';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { formatCOP } from '@/lib/api/utils/utils';
import { getProducts } from '@/lib/api/routes/inventory';
import {
  getStorage,
  checkInStorage,
  toggleStorageWash,
  checkoutStorage,
  cancelStorage,
  updateStorageSettings,
} from '@/lib/api/routes/storage';

const MODES = [
  { id: 'HORA', label: 'Por hora' },
  { id: 'DIA', label: 'Por día' },
  { id: 'MENSUALIDAD', label: 'Mensualidad' },
];
const PAY_METHODS = [
  { id: 'EFECTIVO', label: 'Efectivo' },
  { id: 'TRANSFERENCIA', label: 'Transferencia' },
  { id: 'BANCOLOMBIA', label: 'Bancolombia' },
  { id: 'DATAFONO', label: 'Datáfono' },
];

// Mismo cálculo que el backend, para mostrar el cobro en vivo.
function elapsedLabel(ms) {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(' ');
}
function computeCharge(settings, ticket, nowMs) {
  const helmets = Math.max(1, ticket.helmetCount || 1);
  const mode = ticket.billingMode || settings?.defaultMode || 'HORA';
  const ms = nowMs - new Date(ticket.checkInAt).getTime();
  if (mode === 'MENSUALIDAD') {
    return { mode, storageCharge: 0, perHelmet: 0, helmets, units: 0, unit: 'mes', rate: 0, elapsedLabel: elapsedLabel(ms) };
  }
  const rawMin = Math.max(0, Math.floor(ms / 60000));
  const billable = Math.max(0, rawMin - (settings?.graceMinutes || 0));
  let units = 0;
  let rate = 0;
  let unit = 'hora';
  if (mode === 'DIA') {
    rate = settings?.dayRate || 0;
    unit = 'día';
    units = billable <= 0 ? 0 : Math.max(1, Math.ceil(billable / 1440));
  } else {
    rate = settings?.hourRate || 0;
    unit = 'hora';
    units = billable <= 0 ? 0 : Math.max(1, Math.ceil(billable / 60));
  }
  const perHelmet = Math.round(units * rate);
  return { mode, perHelmet, helmets, storageCharge: perHelmet * helmets, units, unit, rate, elapsedLabel: elapsedLabel(ms) };
}

const EMPTY_CHECKIN = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  billingMode: 'HORA',
  washRequested: false,
  washCount: 1,
  helmetCount: 1,
  notes: '',
};

export default function StoragePage() {
  const { usuario } = useAuth();
  const isOwner = ['SUPER_ADMIN', 'ADMIN'].includes(usuario?.role);

  const [settings, setSettings] = useState(null);
  const [active, setActive] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState({});
  const [now, setNow] = useState(Date.now());

  const [showCheckIn, setShowCheckIn] = useState(false);
  const [ci, setCi] = useState({ ...EMPTY_CHECKIN });

  const [showSettings, setShowSettings] = useState(false);
  const [sForm, setSForm] = useState(null);

  const [products, setProducts] = useState([]);
  const [checkoutTarget, setCheckoutTarget] = useState(null);
  const [co, setCo] = useState({ includeWash: false, products: [], paymentMethod: 'EFECTIVO' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStorage();
      setActive(res?.data || []);
      setSettings(res?.settings || null);
      setSummary(res?.summary || null);
    } catch {
      setActive([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    getProducts({ limit: 500 })
      .then((r) => {
        const list = (r?.data || [])
          .map((p) => {
            const v = (p.variants || [])[0];
            return v ? { variantId: v.id, name: p.name, price: p.salePrice || 0 } : null;
          })
          .filter(Boolean);
        setProducts(list);
      })
      .catch(() => setProducts([]));
  }, [load]);

  // Reloj en vivo (cada 30s) para el cobro que corre con el tiempo.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const inputCls =
    'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20';

  const doCheckIn = async () => {
    if (!ci.customerName.trim()) {
      setAlert({ type: 'warning', message: 'Falta el nombre del cliente.' });
      return;
    }
    if (!ci.customerPhone.trim() && !ci.customerEmail.trim()) {
      setAlert({ type: 'warning', message: 'Indica celular o correo del cliente.' });
      return;
    }
    setBusy(true);
    try {
      const helmets = Math.max(1, Number(ci.helmetCount) || 1);
      await checkInStorage({
        customerName: ci.customerName.trim(),
        customerPhone: ci.customerPhone.trim() || undefined,
        customerEmail: ci.customerEmail.trim() || undefined,
        billingMode: ci.billingMode,
        washRequested: ci.washRequested,
        washCount: ci.washRequested
          ? Math.min(Math.max(1, Number(ci.washCount) || helmets), helmets)
          : 0,
        helmetCount: helmets,
        notes: ci.notes.trim() || undefined,
      });
      setCi({ ...EMPTY_CHECKIN });
      setShowCheckIn(false);
      setAlert({ type: 'success', message: 'Casco recibido en custodia.' });
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo registrar.' });
    } finally {
      setBusy(false);
    }
  };

  const setWash = async (t, done) => {
    setBusy(true);
    try {
      await toggleStorageWash(t.id, done);
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message });
    } finally {
      setBusy(false);
    }
  };

  const cancelTicket = async (t) => {
    if (!window.confirm(`¿Anular el ingreso de ${t.customerName}? No se cobra.`)) return;
    setBusy(true);
    try {
      await cancelStorage(t.id);
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message });
    } finally {
      setBusy(false);
    }
  };

  const openCheckout = (t) => {
    setCheckoutTarget(t);
    setCo({ includeWash: !!t.washRequested, products: [], paymentMethod: 'EFECTIVO' });
  };

  const addProduct = (variantId) => {
    if (!variantId) return;
    setCo((c) => {
      const exists = c.products.find((p) => p.variantId === Number(variantId));
      if (exists) return c;
      const prod = products.find((p) => p.variantId === Number(variantId));
      return { ...c, products: [...c.products, { variantId: Number(variantId), quantity: 1, name: prod?.name, price: prod?.price || 0 }] };
    });
  };
  const setProdQty = (variantId, qty) =>
    setCo((c) => ({ ...c, products: c.products.map((p) => (p.variantId === variantId ? { ...p, quantity: Math.max(1, qty) } : p)) }));
  const removeProduct = (variantId) =>
    setCo((c) => ({ ...c, products: c.products.filter((p) => p.variantId !== variantId) }));

  const checkoutTotals = useMemo(() => {
    if (!checkoutTarget) return null;
    const charge = computeCharge(settings, checkoutTarget, now);
    const washUnits = co.includeWash
      ? Math.max(1, checkoutTarget.washCount || checkoutTarget.helmetCount || 1)
      : 0;
    const wash = washUnits * (settings?.washPrice || 0);
    const prods = co.products.reduce((s, p) => s + (p.price || 0) * p.quantity, 0);
    return { charge, wash, washUnits, prods, total: charge.storageCharge + wash + prods };
  }, [checkoutTarget, settings, now, co]);

  const confirmCheckout = async () => {
    if (!checkoutTarget) return;
    setBusy(true);
    try {
      const res = await checkoutStorage(checkoutTarget.id, {
        paymentMethod: co.paymentMethod,
        includeWash: co.includeWash,
        products: co.products.map((p) => ({ inventoryVariantId: p.variantId, quantity: p.quantity })),
      });
      const total = res?.data?.ticket?.amount ?? 0;
      setCheckoutTarget(null);
      setAlert({ type: 'success', message: `Cobrado y entregado · ${formatCOP(total)}` });
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo cobrar.' });
    } finally {
      setBusy(false);
    }
  };

  const openSettings = () => {
    setSForm({
      hourRate: settings?.hourRate ?? '',
      dayRate: settings?.dayRate ?? '',
      washPrice: settings?.washPrice ?? '',
      graceMinutes: settings?.graceMinutes ?? 0,
      defaultMode: settings?.defaultMode ?? 'HORA',
    });
    setShowSettings(true);
  };
  const saveSettings = async () => {
    setBusy(true);
    try {
      await updateStorageSettings({
        hourRate: Number(sForm.hourRate) || 0,
        dayRate: Number(sForm.dayRate) || 0,
        washPrice: Number(sForm.washPrice) || 0,
        graceMinutes: Number(sForm.graceMinutes) || 0,
        defaultMode: sForm.defaultMode,
      });
      setShowSettings(false);
      setAlert({ type: 'success', message: 'Tarifas guardadas.' });
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message });
    } finally {
      setBusy(false);
    }
  };

  const ratesConfigured = (settings?.hourRate || 0) > 0 || (settings?.dayRate || 0) > 0;

  return (
    <RoleGuard allowedRoles={[Roles.SUPER_ADMIN, Roles.ADMIN, Roles.RECEPCIONISTA, Roles.ASESOR, Roles.CAJA]}>
      <div className="w-full p-4">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-gray-800">Guarda cascos</h1>
          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                type="button"
                onClick={openSettings}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <Cog6ToothIcon className="h-4 w-4" />
                Tarifas
              </button>
            )}
            <Button variant="add" icon={PlusIcon} onClick={() => setShowCheckIn(true)}>
              Recibir casco
            </Button>
          </div>
        </div>
        <p className="mb-5 text-sm text-gray-500">
          Custodia de cascos: registra el ingreso, ofrece el lavado y al entregar el sistema
          calcula el tiempo y arma la factura (guardado + lavado + productos).
        </p>

        {!ratesConfigured && isOwner && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Aún no has configurado las tarifas. Toca <b>Tarifas</b> y define el valor por hora/día y el lavado.
          </div>
        )}

        {/* Resumen */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-semibold uppercase text-blue-700">En custodia</p>
            <p className="mt-1 text-2xl font-extrabold text-blue-900">{summary?.active || 0}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase text-amber-700">Lavados pendientes</p>
            <p className="mt-1 text-2xl font-extrabold text-amber-900">{summary?.washPending || 0}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-gray-500">Tarifa hora</p>
            <p className="mt-1 text-xl font-extrabold text-gray-900">{formatCOP(settings?.hourRate || 0)}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-gray-500">Lavado</p>
            <p className="mt-1 text-xl font-extrabold text-gray-900">{formatCOP(settings?.washPrice || 0)}</p>
          </div>
        </div>

        {/* Lista de cascos en custodia */}
        {loading ? (
          <p className="py-12 text-center text-sm text-gray-400">Cargando…</p>
        ) : active.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-14 text-center">
            <ArchiveBoxIcon className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No hay cascos en custodia.</p>
            <p className="mt-1 text-xs text-gray-400">Toca “Recibir casco” cuando llegue un cliente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {active.map((t) => {
              const charge = computeCharge(settings, t, now);
              const washPending = t.washRequested && !t.washDone;
              return (
                <div key={t.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 font-semibold text-gray-800">
                        <UserIcon className="h-4 w-4 flex-none text-gray-400" />
                        {t.customerName}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {t.customerPhone || t.customerEmail || ''}
                        {t.helmetCount > 1 ? ` · ${t.helmetCount} cascos` : ''}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                          <ClockIcon className="h-3.5 w-3.5" />
                          {charge.elapsedLabel}
                        </span>
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                          {t.billingMode === 'DIA' ? 'Por día' : t.billingMode === 'MENSUALIDAD' ? 'Mensualidad' : 'Por hora'}
                        </span>
                        {t.washRequested && (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${t.washDone ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                            <SparklesIcon className="h-3.5 w-3.5" />
                            {t.washDone ? 'Casco lavado' : 'Lavado pendiente'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">A cobrar (guardado)</p>
                      <p className="text-xl font-extrabold text-gray-900">{formatCOP(charge.storageCharge)}</p>
                      {charge.mode !== 'MENSUALIDAD' && charge.units > 0 && (
                        <p className="text-[10px] text-gray-400">
                          {charge.units} {charge.unit}{charge.units > 1 ? 's' : ''} × {formatCOP(charge.rate)}
                          {charge.helmets > 1 ? ` × ${charge.helmets} cascos` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-2">
                      {washPending && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setWash(t, true)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                        >
                          <SparklesIcon className="h-3.5 w-3.5" />
                          Marcar lavado listo
                        </button>
                      )}
                      {isOwner && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => cancelTicket(t)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                          Anular
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => openCheckout(t)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50"
                    >
                      <BanknotesIcon className="h-4 w-4" />
                      Cobrar y entregar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: recibir casco (check-in) */}
        {showCheckIn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCheckIn(false)}>
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">Recibir casco</h2>
                <button onClick={() => setShowCheckIn(false)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Nombre completo del cliente</label>
                  <input value={ci.customerName} onChange={(e) => setCi((c) => ({ ...c, customerName: e.target.value }))} placeholder="Ej: Juan Pérez" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Celular</label>
                    <input value={ci.customerPhone} onChange={(e) => setCi((c) => ({ ...c, customerPhone: e.target.value }))} placeholder="300…" className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Correo (opcional)</label>
                    <input value={ci.customerEmail} onChange={(e) => setCi((c) => ({ ...c, customerEmail: e.target.value }))} placeholder="correo@…" className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Cobro</label>
                    <select value={ci.billingMode} onChange={(e) => setCi((c) => ({ ...c, billingMode: e.target.value }))} className={inputCls}>
                      {MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600"># de cascos</label>
                    <input type="number" min="1" value={ci.helmetCount} onChange={(e) => setCi((c) => ({ ...c, helmetCount: e.target.value }))} className={inputCls} />
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 px-3 py-2.5">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input type="checkbox" checked={ci.washRequested} onChange={(e) => setCi((c) => ({ ...c, washRequested: e.target.checked, washCount: c.washCount || Number(c.helmetCount) || 1 }))} className="h-4 w-4 accent-orange-500" />
                    <SparklesIcon className="h-4 w-4 text-orange-500" />
                    El cliente quiere <b>lavado</b> {settings?.washPrice ? `(${formatCOP(settings.washPrice)} c/u)` : ''}
                  </label>
                  {ci.washRequested && Number(ci.helmetCount) > 1 && (
                    <div className="mt-2 flex items-center gap-2 pl-6 text-sm text-gray-600">
                      ¿Cuántos lavar?
                      <input
                        type="number"
                        min="1"
                        max={Number(ci.helmetCount) || 1}
                        value={ci.washCount}
                        onChange={(e) => setCi((c) => ({ ...c, washCount: e.target.value }))}
                        className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-sm"
                      />
                      <span className="text-xs text-gray-400">de {ci.helmetCount}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Nota (opcional)</label>
                  <input value={ci.notes} onChange={(e) => setCi((c) => ({ ...c, notes: e.target.value }))} placeholder="Ej: casco negro con visor" className={inputCls} />
                </div>
                <p className="text-[11px] text-gray-400">La hora de ingreso se registra automáticamente ahora.</p>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowCheckIn(false)}>Cancelar</Button>
                <Button variant="primary" icon={CheckCircleIcon} onClick={doCheckIn} loading={busy}>Recibir</Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: cobrar y entregar */}
        {checkoutTarget && checkoutTotals && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setCheckoutTarget(null)}>
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">Cobrar y entregar</h2>
                <button onClick={() => setCheckoutTarget(null)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="font-semibold text-gray-800">{checkoutTarget.customerName}</p>
                <p className="text-xs text-gray-500">Tiempo en custodia: {checkoutTotals.charge.elapsedLabel}</p>
              </div>

              {/* Desglose */}
              <div className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Guardado{' '}
                    {checkoutTotals.charge.mode === 'MENSUALIDAD'
                      ? '(mensualidad)'
                      : `(${checkoutTotals.charge.units} ${checkoutTotals.charge.unit}${checkoutTotals.charge.units > 1 ? 's' : ''}${checkoutTotals.charge.helmets > 1 ? ` × ${checkoutTotals.charge.helmets} cascos` : ''})`}
                  </span>
                  <span className="font-semibold text-gray-900">{formatCOP(checkoutTotals.charge.storageCharge)}</span>
                </div>
                <label className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-600">
                    <input type="checkbox" checked={co.includeWash} onChange={(e) => setCo((c) => ({ ...c, includeWash: e.target.checked }))} className="h-4 w-4 accent-orange-500" />
                    Lavado{checkoutTotals.washUnits > 1 ? ` (${checkoutTotals.washUnits} cascos)` : ''}
                  </span>
                  <span className="font-semibold text-gray-900">{formatCOP(checkoutTotals.wash)}</span>
                </label>
                {co.products.map((p) => (
                  <div key={p.variantId} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <button onClick={() => removeProduct(p.variantId)} className="text-gray-300 hover:text-red-500"><XMarkIcon className="h-4 w-4" /></button>
                      {p.name}
                      <input type="number" min="1" value={p.quantity} onChange={(e) => setProdQty(p.variantId, Number(e.target.value))} className="w-12 rounded border border-gray-200 px-1 py-0.5 text-xs" />
                    </span>
                    <span className="font-semibold text-gray-900">{formatCOP((p.price || 0) * p.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Agregar producto */}
              {products.length > 0 && (
                <div className="mt-3">
                  <select onChange={(e) => { addProduct(e.target.value); e.target.value = ''; }} className={inputCls} defaultValue="">
                    <option value="">+ Agregar producto…</option>
                    {products.map((p) => <option key={p.variantId} value={p.variantId}>{p.name} · {formatCOP(p.price)}</option>)}
                  </select>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3">
                <span className="text-sm font-semibold text-gray-700">Total a cobrar</span>
                <span className="text-2xl font-extrabold text-orange-600">{formatCOP(checkoutTotals.total)}</span>
              </div>

              <div className="mt-3">
                <label className="mb-1 block text-xs font-semibold text-gray-600">Método de pago</label>
                <select value={co.paymentMethod} onChange={(e) => setCo((c) => ({ ...c, paymentMethod: e.target.value }))} className={inputCls}>
                  {PAY_METHODS.map((pm) => <option key={pm.id} value={pm.id}>{pm.label}</option>)}
                </select>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setCheckoutTarget(null)}>Cancelar</Button>
                <Button variant="primary" icon={BanknotesIcon} onClick={confirmCheckout} loading={busy}>
                  Cobrar {formatCOP(checkoutTotals.total)}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: tarifas (dueño) */}
        {showSettings && sForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowSettings(false)}>
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">Tarifas de guarda cascos</h2>
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Valor por hora</label>
                    <MoneyInput value={sForm.hourRate} onChange={(v) => setSForm((f) => ({ ...f, hourRate: v }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Valor por día</label>
                    <MoneyInput value={sForm.dayRate} onChange={(v) => setSForm((f) => ({ ...f, dayRate: v }))} className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Valor del lavado</label>
                    <MoneyInput value={sForm.washPrice} onChange={(v) => setSForm((f) => ({ ...f, washPrice: v }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Minutos de gracia</label>
                    <input type="number" min="0" value={sForm.graceMinutes} onChange={(e) => setSForm((f) => ({ ...f, graceMinutes: e.target.value }))} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Cobro por defecto</label>
                  <select value={sForm.defaultMode} onChange={(e) => setSForm((f) => ({ ...f, defaultMode: e.target.value }))} className={inputCls}>
                    {MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                </div>
                <p className="text-[11px] text-gray-400">Los minutos de gracia son el tiempo inicial sin cobro. El cobro se calcula redondeando hacia arriba a la siguiente hora/día.</p>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowSettings(false)}>Cancelar</Button>
                <Button variant="primary" icon={CheckCircleIcon} onClick={saveSettings} loading={busy}>Guardar tarifas</Button>
              </div>
            </div>
          </div>
        )}

        <AlertModal type={alert.type} message={alert.message} onClose={() => setAlert({})} />
      </div>
    </RoleGuard>
  );
}
