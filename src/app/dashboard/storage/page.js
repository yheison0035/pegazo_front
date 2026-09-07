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
  PrinterIcon,
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
  getStorageHistory,
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

function Row({ l, r }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-500">{l}</span>
      <span className="text-right font-semibold text-gray-800">{r}</span>
    </div>
  );
}

const money = (n) =>
  '$' + Math.round(n || 0).toLocaleString('es-CO');

// Documento térmico (80mm) imprimible.
function printReceipt(title, business, bodyHTML) {
  const w = window.open('', '_blank', 'width=340,height=620');
  if (!w) return;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>
      *{font-family:'Courier New',monospace;box-sizing:border-box}
      body{width:280px;margin:0 auto;padding:10px;color:#000;font-size:12px;line-height:1.4}
      h1{font-size:15px;text-align:center;margin:0}
      .sub{text-align:center;font-size:11px;margin:2px 0 8px}
      .big{font-size:22px;font-weight:bold;text-align:center;margin:6px 0}
      .row{display:flex;justify-content:space-between;gap:8px;margin:2px 0}
      .row .r{font-weight:bold;text-align:right}
      hr{border:none;border-top:1px dashed #000;margin:7px 0}
      .center{text-align:center}
      .muted{color:#444;font-size:10px}
      .tot{font-size:16px;font-weight:bold}
    </style></head><body onload="setTimeout(function(){window.print()},150)">
    <h1>${business}</h1>
    ${bodyHTML}
    </body></html>`);
  w.document.close();
  w.focus();
}

function ingresoBody(t, settings) {
  const modeLabel =
    t.billingMode === 'DIA' ? 'Por día' : t.billingMode === 'MENSUALIDAD' ? 'Mensualidad' : 'Por hora';
  return `
    <p class="sub">Comprobante de ingreso</p>
    <div class="big">TICKET #${t.id}</div>
    <p class="center muted">Guarde este comprobante para reclamar su(s) casco(s)</p>
    <hr/>
    <div class="row"><span>Cliente</span><span class="r">${t.customerName}</span></div>
    ${t.customerPhone ? `<div class="row"><span>Celular</span><span class="r">${t.customerPhone}</span></div>` : ''}
    ${t.customerEmail ? `<div class="row"><span>Correo</span><span class="r">${t.customerEmail}</span></div>` : ''}
    <div class="row"><span>Ingreso</span><span class="r">${new Date(t.checkInAt).toLocaleString('es-CO')}</span></div>
    <div class="row"><span>Cascos</span><span class="r">${t.helmetCount}</span></div>
    ${t.washRequested ? `<div class="row"><span>Lavado</span><span class="r">${t.washCount || t.helmetCount} casco(s)</span></div>` : ''}
    <div class="row"><span>Cobro</span><span class="r">${modeLabel}</span></div>
    ${t.notes ? `<div class="row"><span>Nota</span><span class="r">${t.notes}</span></div>` : ''}
    <hr/>
    <p class="center muted">Tarifa ${settings?.hourRate ? money(settings.hourRate) + '/hora' : ''}${settings?.washPrice ? ' · lavado ' + money(settings.washPrice) : ''}</p>`;
}

function facturaBody(t, tot, methodLabel) {
  const rows = [];
  if (tot.charge.storageCharge > 0)
    rows.push(
      `<div class="row"><span>Guardado ${tot.charge.units} ${tot.charge.unit}${tot.charge.units > 1 ? 's' : ''}${tot.charge.helmets > 1 ? ' x' + tot.charge.helmets : ''}</span><span class="r">${money(tot.charge.storageCharge)}</span></div>`,
    );
  if (tot.wash > 0)
    rows.push(
      `<div class="row"><span>Lavado${tot.washUnits > 1 ? ' x' + tot.washUnits : ''}</span><span class="r">${money(tot.wash)}</span></div>`,
    );
  (tot.products || []).forEach((p) =>
    rows.push(
      `<div class="row"><span>${p.name} x${p.quantity}</span><span class="r">${money((p.price || 0) * p.quantity)}</span></div>`,
    ),
  );
  return `
    <p class="sub">Factura de venta</p>
    <p class="center muted">${new Date().toLocaleString('es-CO')} · Ticket #${t.id}</p>
    <hr/>
    <div class="row"><span>Cliente</span><span class="r">${t.customerName}</span></div>
    ${t.customerPhone ? `<div class="row"><span>Celular</span><span class="r">${t.customerPhone}</span></div>` : ''}
    <div class="row"><span>Cascos</span><span class="r">${t.helmetCount}</span></div>
    <hr/>
    ${rows.join('')}
    <hr/>
    <div class="row tot"><span>TOTAL</span><span class="r">${money(tot.total)}</span></div>
    <div class="row"><span>Pago</span><span class="r">${methodLabel}</span></div>
    <hr/>
    <p class="center muted">¡Gracias por su visita!</p>`;
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
  const businessName = usuario?.company?.name || 'Guarda cascos';

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

  const [tab, setTab] = useState('activos'); // activos | historial
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Buscadores y filtros
  const [q, setQ] = useState(''); // buscador en custodia
  const [washOnly, setWashOnly] = useState(false);
  const [histQ, setHistQ] = useState(''); // buscador en historial
  // Recibo/factura en pantalla (con impresión)
  const [receipt, setReceipt] = useState(null); // {kind:'ingreso'|'factura', ...}

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await getStorageHistory(50);
      setHistory(res?.data || []);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'historial') loadHistory();
  }, [tab, loadHistory]);

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
    const phone = ci.customerPhone.trim();
    const email = ci.customerEmail.trim();
    if (!phone && !email) {
      setAlert({ type: 'warning', message: 'Indica celular o correo del cliente.' });
      return;
    }
    if (phone && !/^3\d{9}$/.test(phone)) {
      setAlert({
        type: 'warning',
        message: 'El celular debe tener 10 dígitos y empezar por 3 (ej: 3001234567).',
      });
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAlert({ type: 'warning', message: 'El correo no es válido.' });
      return;
    }
    setBusy(true);
    try {
      const helmets = Math.max(1, Number(ci.helmetCount) || 1);
      const res = await checkInStorage({
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
      load();
      // Muestra el comprobante de ingreso (con opción de imprimir).
      const ticket = res?.data;
      if (ticket) setReceipt({ kind: 'ingreso', ticket });
      else setAlert({ type: 'success', message: 'Casco recibido en custodia.' });
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
      await checkoutStorage(checkoutTarget.id, {
        paymentMethod: co.paymentMethod,
        includeWash: co.includeWash,
        products: co.products.map((p) => ({ inventoryVariantId: p.variantId, quantity: p.quantity })),
      });
      // Arma la factura para mostrarla/imprimirla con todos los datos.
      const methodLabel =
        (PAY_METHODS.find((m) => m.id === co.paymentMethod) || {}).label || co.paymentMethod;
      const tot = { ...checkoutTotals, products: co.products };
      const ticket = checkoutTarget;
      setCheckoutTarget(null);
      setReceipt({ kind: 'factura', ticket, tot, methodLabel });
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

  // Filtro de la lista en custodia (buscador por # o nombre + solo lavados).
  const filteredActive = useMemo(() => {
    let list = active;
    if (washOnly) list = list.filter((t) => t.washRequested && !t.washDone);
    const s = q.trim().toLowerCase();
    if (s)
      list = list.filter(
        (t) =>
          String(t.id).includes(s) ||
          (t.customerName || '').toLowerCase().includes(s) ||
          (t.customerPhone || '').includes(s),
      );
    return list;
  }, [active, washOnly, q]);

  // Filtro del historial (buscador por # o nombre).
  const filteredHistory = useMemo(() => {
    const s = histQ.trim().toLowerCase();
    if (!s) return history;
    return history.filter(
      (h) =>
        String(h.id).includes(s) ||
        (h.customerName || '').toLowerCase().includes(s) ||
        (h.customerPhone || '').includes(s),
    );
  }, [history, histQ]);

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

        {/* Resumen (clicable: filtra la lista) */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => { setTab('activos'); setWashOnly(false); setQ(''); }}
            className={`rounded-2xl border p-4 text-left transition hover:shadow-md ${tab === 'activos' && !washOnly ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-500/20' : 'border-blue-200 bg-blue-50'}`}
          >
            <p className="text-xs font-semibold uppercase text-blue-700">En custodia</p>
            <p className="mt-1 text-2xl font-extrabold text-blue-900">{summary?.active || 0}</p>
            <p className="text-[10px] text-blue-700/60">Ver lista</p>
          </button>
          <button
            type="button"
            onClick={() => { setTab('activos'); setWashOnly(true); }}
            className={`rounded-2xl border p-4 text-left transition hover:shadow-md ${washOnly ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-500/20' : 'border-amber-200 bg-amber-50'}`}
          >
            <p className="text-xs font-semibold uppercase text-amber-700">Lavados pendientes</p>
            <p className="mt-1 text-2xl font-extrabold text-amber-900">{summary?.washPending || 0}</p>
            <p className="text-[10px] text-amber-700/60">Ver solo estos</p>
          </button>
          <button
            type="button"
            onClick={() => isOwner && openSettings()}
            className="rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:shadow-md"
          >
            <p className="text-xs font-semibold uppercase text-gray-500">Tarifa hora</p>
            <p className="mt-1 text-xl font-extrabold text-gray-900">{formatCOP(settings?.hourRate || 0)}</p>
            {isOwner && <p className="text-[10px] text-gray-400">Editar tarifas</p>}
          </button>
          <button
            type="button"
            onClick={() => isOwner && openSettings()}
            className="rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:shadow-md"
          >
            <p className="text-xs font-semibold uppercase text-gray-500">Lavado</p>
            <p className="mt-1 text-xl font-extrabold text-gray-900">{formatCOP(settings?.washPrice || 0)}</p>
            {isOwner && <p className="text-[10px] text-gray-400">Editar tarifas</p>}
          </button>
        </div>

        {/* Pestañas: en custodia / historial */}
        <div className="mb-4 inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => setTab('activos')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === 'activos' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <ArchiveBoxIcon className="h-4 w-4" />
            En custodia {summary?.active ? `(${summary.active})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setTab('historial')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === 'historial' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <ClockIcon className="h-4 w-4" />
            Historial
          </button>
        </div>

        {/* Historial de entregados (3 columnas + buscador) */}
        {tab === 'historial' && (
          <>
            <div className="mb-3">
              <input
                value={histQ}
                onChange={(e) => setHistQ(e.target.value)}
                placeholder="Buscar por # de ticket o nombre…"
                className="w-full max-w-xs rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            {loadingHistory ? (
              <p className="py-12 text-center text-sm text-gray-400">Cargando…</p>
            ) : filteredHistory.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-14 text-center">
                <p className="text-sm text-gray-500">
                  {history.length === 0 ? 'Aún no hay entregas registradas.' : 'Sin resultados para tu búsqueda.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredHistory.map((h) => (
                  <div key={h.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-800">{h.customerName}</p>
                        <p className="text-[11px] text-gray-400">
                          #{h.id} · {h.customerPhone || h.customerEmail || ''}
                        </p>
                      </div>
                      <span className="whitespace-nowrap rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                        {h.helmetCount} casco{h.helmetCount > 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="mt-2 text-xl font-extrabold text-gray-900">{formatCOP(h.amount || 0)}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-gray-400">
                      <span>{h.checkOutAt ? new Date(h.checkOutAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</span>
                      {h.washRequested && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                          <SparklesIcon className="h-3 w-3" /> {h.washCount || h.helmetCount} lavado(s)
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        printReceipt(
                          businessName,
                          businessName,
                          facturaBody(
                            h,
                            {
                              charge: { storageCharge: h.amount || 0, units: 0, unit: '', helmets: h.helmetCount },
                              wash: 0,
                              washUnits: 0,
                              products: [],
                              total: h.amount || 0,
                            },
                            'Pagado',
                          ),
                        )
                      }
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      <PrinterIcon className="h-3.5 w-3.5" />
                      Reimprimir factura
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Lista de cascos en custodia */}
        {tab === 'activos' && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por # de ticket o nombre…"
              className="w-full max-w-xs rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
            {washOnly && (
              <button
                type="button"
                onClick={() => setWashOnly(false)}
                className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800"
              >
                Solo lavados pendientes
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {loading ? (
          <p className="py-12 text-center text-sm text-gray-400">Cargando…</p>
        ) : filteredActive.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-14 text-center">
            <ArchiveBoxIcon className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">{active.length === 0 ? 'No hay cascos en custodia.' : 'Sin resultados para tu búsqueda.'}</p>
            {active.length === 0 && <p className="mt-1 text-xs text-gray-400">Toca “Recibir casco” cuando llegue un cliente.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {filteredActive.map((t) => {
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
                      <button
                        type="button"
                        title="Reimprimir comprobante"
                        onClick={() => printReceipt('Comprobante', businessName, ingresoBody(t, settings))}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-gray-500 hover:bg-gray-100"
                      >
                        <PrinterIcon className="h-3.5 w-3.5" />
                        Comprobante
                      </button>
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
        </>
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
                  <input
                    value={ci.customerName}
                    onChange={(e) => setCi((c) => ({ ...c, customerName: e.target.value.toUpperCase() }))}
                    placeholder="EJ: JUAN PÉREZ"
                    className={`${inputCls} uppercase placeholder:normal-case`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Celular</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={ci.customerPhone}
                      onChange={(e) =>
                        setCi((c) => ({
                          ...c,
                          customerPhone: e.target.value.replace(/\D/g, '').slice(0, 10),
                        }))
                      }
                      placeholder="3001234567"
                      className={`${inputCls} ${
                        ci.customerPhone && !/^3\d{9}$/.test(ci.customerPhone)
                          ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                          : ''
                      }`}
                    />
                    {ci.customerPhone && !/^3\d{9}$/.test(ci.customerPhone) && (
                      <p className="mt-1 text-[11px] text-red-500">
                        10 dígitos, empieza por 3.
                      </p>
                    )}
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

        {/* Comprobante / factura en pantalla (con impresión) */}
        {receipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setReceipt(null)}>
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className={`flex items-center gap-2 rounded-t-2xl px-5 py-4 text-white ${receipt.kind === 'ingreso' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                {receipt.kind === 'ingreso' ? <CheckCircleIcon className="h-6 w-6" /> : <BanknotesIcon className="h-6 w-6" />}
                <div>
                  <p className="text-sm font-bold">
                    {receipt.kind === 'ingreso' ? 'Casco recibido' : 'Cobrado y entregado'}
                  </p>
                  <p className="text-xs text-white/80">Ticket #{receipt.ticket.id}</p>
                </div>
              </div>

              <div className="p-5">
                <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm">
                  <p className="text-center font-bold text-gray-800">{businessName}</p>
                  <p className="mb-2 text-center text-[11px] text-gray-400">
                    {receipt.kind === 'ingreso' ? 'Comprobante de ingreso' : 'Factura de venta'}
                  </p>
                  <div className="space-y-1 border-t border-gray-100 pt-2">
                    <Row l="Cliente" r={receipt.ticket.customerName} />
                    {receipt.ticket.customerPhone && <Row l="Celular" r={receipt.ticket.customerPhone} />}
                    {receipt.kind === 'ingreso' ? (
                      <>
                        <Row l="Ingreso" r={new Date(receipt.ticket.checkInAt).toLocaleString('es-CO')} />
                        <Row l="Cascos" r={receipt.ticket.helmetCount} />
                        {receipt.ticket.washRequested && (
                          <Row l="Lavado" r={`${receipt.ticket.washCount || receipt.ticket.helmetCount} casco(s)`} />
                        )}
                        <Row l="Cobro" r={receipt.ticket.billingMode === 'DIA' ? 'Por día' : receipt.ticket.billingMode === 'MENSUALIDAD' ? 'Mensualidad' : 'Por hora'} />
                      </>
                    ) : (
                      <>
                        {receipt.tot.charge.storageCharge > 0 && (
                          <Row l={`Guardado${receipt.tot.charge.helmets > 1 ? ' ×' + receipt.tot.charge.helmets : ''}`} r={formatCOP(receipt.tot.charge.storageCharge)} />
                        )}
                        {receipt.tot.wash > 0 && <Row l={`Lavado${receipt.tot.washUnits > 1 ? ' ×' + receipt.tot.washUnits : ''}`} r={formatCOP(receipt.tot.wash)} />}
                        {(receipt.tot.products || []).map((p) => (
                          <Row key={p.variantId} l={`${p.name} ×${p.quantity}`} r={formatCOP((p.price || 0) * p.quantity)} />
                        ))}
                        <div className="mt-1 flex justify-between border-t border-gray-200 pt-2 text-base font-extrabold text-gray-900">
                          <span>TOTAL</span>
                          <span>{formatCOP(receipt.tot.total)}</span>
                        </div>
                        <Row l="Pago" r={receipt.methodLabel} />
                      </>
                    )}
                  </div>
                  {receipt.kind === 'ingreso' && (
                    <p className="mt-3 text-center text-[10px] text-gray-400">
                      Guarde este comprobante para reclamar su(s) casco(s).
                    </p>
                  )}
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setReceipt(null)}>Cerrar</Button>
                  <Button
                    variant="primary"
                    icon={PrinterIcon}
                    onClick={() =>
                      printReceipt(
                        receipt.kind === 'ingreso' ? 'Comprobante' : 'Factura',
                        businessName,
                        receipt.kind === 'ingreso'
                          ? ingresoBody(receipt.ticket, settings)
                          : facturaBody(receipt.ticket, receipt.tot, receipt.methodLabel),
                      )
                    }
                  >
                    Imprimir
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <AlertModal type={alert.type} message={alert.message} onClose={() => setAlert({})} />
      </div>
    </RoleGuard>
  );
}
