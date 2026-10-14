'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  TruckIcon,
  PlusIcon,
  ClockIcon,
  XMarkIcon,
  BanknotesIcon,
  TrashIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import Button from '@/components/ui/Button';
import MoneyInput from '@/components/ui/MoneyInput';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { useAuth } from '@/context/authContext';
import { formatCOP } from '@/lib/api/utils/utils';
import { printParkingTicket } from '@/utils/printParkingTicket';
import { printSaleInvoice } from '@/utils/printInvoice';
import {
  getParking,
  getVehicleTypes,
  getParkingSettings,
  updateParkingSettings,
  createVehicleType,
  updateVehicleType,
  deleteVehicleType,
  parkingCheckIn,
  parkingCheckout,
  parkingCancel,
} from '@/lib/api/routes/parking';

const PAY_METHODS = [
  { id: 'EFECTIVO', label: 'Efectivo' },
  { id: 'TARJETA', label: 'Tarjeta' },
  { id: 'TRANSFERENCIA', label: 'Transferencia' },
];

const inp =
  'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20';

function elapsedLabel(from, now) {
  const ms = Math.max(0, now - new Date(from).getTime());
  const totalMin = Math.floor(ms / 60000);
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(' ');
}

function ParkingInner() {
  const { usuario } = useAuth();
  const isOwner = ['SUPER_ADMIN', 'ADMIN'].includes(usuario?.role);

  const [tab, setTab] = useState('operar');
  const [tickets, setTickets] = useState([]);
  const [types, setTypes] = useState([]);
  const [settings, setSettings] = useState(null);
  const [summary, setSummary] = useState({ inside: 0, byType: {} });
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({});
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);

  // Ingreso
  const [form, setForm] = useState({
    plate: '',
    vehicleTypeId: '',
    isMonthly: false,
    customerName: '',
    customerPhone: '',
    notes: '',
  });
  // Salida (checkout)
  const [co, setCo] = useState(null); // ticket objetivo
  const [coForm, setCoForm] = useState({ paymentMethod: 'EFECTIVO', cashReceived: '' });

  const load = useCallback(async () => {
    try {
      const [p, t] = await Promise.all([getParking(), getVehicleTypes()]);
      setTickets(p?.data || []);
      setSettings(p?.settings || null);
      setSummary(p?.summary || { inside: 0, byType: {} });
      setTypes(t?.data || []);
    } catch (e) {
      setAlert({ type: 'error', message: e?.message || 'No se pudo cargar.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Reloj para los tiempos en vivo + refresco periódico de cobros.
  useEffect(() => {
    const clock = setInterval(() => setNow(Date.now()), 1000);
    const refresh = setInterval(load, 25000);
    return () => {
      clearInterval(clock);
      clearInterval(refresh);
    };
  }, [load]);

  const typeById = useMemo(() => {
    const m = {};
    for (const t of types) m[t.id] = t;
    return m;
  }, [types]);

  const doCheckIn = async () => {
    if (!form.plate.trim() && !form.customerName.trim()) {
      setAlert({ type: 'error', message: 'Indica la placa o el nombre.' });
      return;
    }
    setBusy(true);
    try {
      const res = await parkingCheckIn({
        plate: form.plate,
        vehicleTypeId: form.vehicleTypeId ? Number(form.vehicleTypeId) : undefined,
        isMonthly: form.isMonthly,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        notes: form.notes,
      });
      const ticket = res?.data;
      printParkingTicket(ticket, usuario, typeById[Number(form.vehicleTypeId)]);
      setForm({
        plate: '',
        vehicleTypeId: form.vehicleTypeId,
        isMonthly: false,
        customerName: '',
        customerPhone: '',
        notes: '',
      });
      await load();
    } catch (e) {
      setAlert({ type: 'error', message: e?.message || 'No se pudo registrar.' });
    } finally {
      setBusy(false);
    }
  };

  const openCheckout = (t) => {
    setCo(t);
    setCoForm({ paymentMethod: 'EFECTIVO', cashReceived: '' });
  };

  const doCheckout = async () => {
    if (!co) return;
    setBusy(true);
    try {
      const res = await parkingCheckout(co.id, {
        paymentMethod: coForm.paymentMethod,
        cashReceived:
          coForm.paymentMethod === 'EFECTIVO' && coForm.cashReceived
            ? Number(coForm.cashReceived)
            : undefined,
      });
      const sale = res?.data?.sale;
      if (sale) {
        printSaleInvoice(sale, usuario, {
          plate: co.plate,
          customerName: co.customerName,
        });
      }
      setCo(null);
      await load();
    } catch (e) {
      setAlert({ type: 'error', message: e?.message || 'No se pudo cobrar.' });
    } finally {
      setBusy(false);
    }
  };

  const doCancel = async (t) => {
    if (!confirm(`¿Anular el ingreso de ${t.plate || t.code}? No genera cobro.`))
      return;
    try {
      await parkingCancel(t.id);
      await load();
    } catch (e) {
      setAlert({ type: 'error', message: e?.message || 'No se pudo anular.' });
    }
  };

  return (
    <div className="w-full max-w-5xl p-4">
      <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-800 sm:text-2xl">
        <TruckIcon className="h-6 w-6 text-orange-500" />
        Parqueadero
      </h1>
      <p className="mb-4 mt-1 text-sm text-gray-500">
        Controla el ingreso y la salida de vehículos. El cobro se calcula por
        tiempo según la tarifa del tipo de vehículo.
      </p>

      {/* Tabs */}
      <div className="mb-5 inline-flex rounded-xl border border-gray-200 p-1">
        <button
          onClick={() => setTab('operar')}
          className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${
            tab === 'operar' ? 'bg-orange-500 text-white' : 'text-gray-500'
          }`}
        >
          Operación
        </button>
        {isOwner && (
          <button
            onClick={() => setTab('tarifas')}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${
              tab === 'tarifas' ? 'bg-orange-500 text-white' : 'text-gray-500'
            }`}
          >
            Tarifas
          </button>
        )}
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-gray-400">Cargando…</p>
      ) : tab === 'operar' ? (
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          {/* Ingreso */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-gray-800">
              <PlusIcon className="h-4 w-4 text-orange-500" /> Registrar ingreso
            </p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Placa
                </label>
                <input
                  value={form.plate}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      plate: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="ABC123"
                  className={`${inp} font-semibold tracking-wider`}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Tipo de vehículo
                </label>
                <select
                  value={form.vehicleTypeId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, vehicleTypeId: e.target.value }))
                  }
                  className={inp}
                >
                  <option value="">Selecciona…</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.hourRate ? ` · ${formatCOP(t.hourRate)}/h` : ''}
                    </option>
                  ))}
                </select>
                {types.length === 0 && (
                  <p className="mt-1 text-[11px] text-amber-600">
                    Crea tus tipos de vehículo en la pestaña Tarifas.
                  </p>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={form.isMonthly}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isMonthly: e.target.checked }))
                  }
                  className="h-4 w-4 accent-orange-500"
                />
                Mensualidad (no cobra por tiempo)
              </label>
              <input
                value={form.customerName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customerName: e.target.value }))
                }
                placeholder="Nombre del cliente (opcional)"
                className={inp}
              />
              <input
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Nota / observación (opcional)"
                className={inp}
              />
              <Button
                variant="primary"
                className="w-full"
                loading={busy}
                onClick={doCheckIn}
              >
                Registrar e imprimir ticket
              </Button>
            </div>
          </div>

          {/* Vehículos dentro */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-gray-800">
                Vehículos dentro ({summary.inside})
              </p>
            </div>
            {tickets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center text-sm text-gray-400">
                No hay vehículos dentro.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {tickets.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-lg font-extrabold tracking-wider text-gray-900">
                          {t.plate || t.code}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t.vehicleTypeName || 'Sin tipo'}
                          {t.isMonthly ? ' · Mensualidad' : ''}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                        <ClockIcon className="h-3 w-3" />
                        {elapsedLabel(t.checkInAt, now)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-800">
                        {t.isMonthly ? 'Mensualidad' : formatCOP(t.quote?.amount || 0)}
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => doCancel(t)}
                          title="Anular"
                          className="rounded-lg border border-gray-200 p-2 text-gray-400 hover:text-red-600"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openCheckout(t)}
                        >
                          <ArrowRightOnRectangleIcon className="mr-1 h-4 w-4" />
                          Salida
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <TarifasTab
          types={types}
          settings={settings}
          onChanged={load}
          setAlert={setAlert}
        />
      )}

      {/* Modal de salida/cobro */}
      {co && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Salida y cobro
                </p>
                <h2 className="text-2xl font-extrabold tracking-wider text-gray-900">
                  {co.plate || co.code}
                </h2>
                <p className="text-xs text-gray-500">
                  {co.vehicleTypeName || 'Sin tipo'} ·{' '}
                  {elapsedLabel(co.checkInAt, now)}
                </p>
              </div>
              <button
                onClick={() => setCo(null)}
                className="text-gray-400 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-4 rounded-xl bg-gray-50 p-4 text-center">
              <p className="text-xs text-gray-500">Total a cobrar</p>
              <p className="text-3xl font-extrabold text-gray-900">
                {co.isMonthly ? '$0' : formatCOP(co.quote?.amount || 0)}
              </p>
              {co.isMonthly && (
                <p className="text-[11px] text-emerald-600">
                  Cubierto por mensualidad
                </p>
              )}
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Medio de pago
              </label>
              <select
                value={coForm.paymentMethod}
                onChange={(e) =>
                  setCoForm((c) => ({ ...c, paymentMethod: e.target.value }))
                }
                className={inp}
              >
                {PAY_METHODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            {coForm.paymentMethod === 'EFECTIVO' && !co.isMonthly && (
              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Efectivo recibido (opcional)
                </label>
                <MoneyInput
                  value={coForm.cashReceived}
                  onChange={(v) => setCoForm((c) => ({ ...c, cashReceived: v }))}
                  className={inp}
                />
                {coForm.cashReceived &&
                  Number(coForm.cashReceived) > (co.quote?.amount || 0) && (
                    <p className="mt-1 text-xs text-gray-500">
                      Cambio:{' '}
                      <b>
                        {formatCOP(
                          Number(coForm.cashReceived) - (co.quote?.amount || 0),
                        )}
                      </b>
                    </p>
                  )}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setCo(null)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                icon={BanknotesIcon}
                loading={busy}
                onClick={doCheckout}
              >
                Cobrar y facturar
              </Button>
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
  );
}

function TarifasTab({ types, settings, onChanged, setAlert }) {
  const [rows, setRows] = useState([]);
  const [grace, setGrace] = useState(settings?.graceMinutes || 0);
  const [roundUp, setRoundUp] = useState(!!settings?.roundUpToHour);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRows(types.map((t) => ({ ...t })));
  }, [types]);
  useEffect(() => {
    setGrace(settings?.graceMinutes || 0);
    setRoundUp(!!settings?.roundUpToHour);
  }, [settings]);

  const addRow = () =>
    setRows((r) => [
      ...r,
      { name: '', hourRate: '', dayMax: '', monthRate: '', capacity: '', _new: true },
    ]);

  const setCell = (i, k, v) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)));

  const saveRow = async (i) => {
    const row = rows[i];
    if (!String(row.name).trim()) {
      setAlert({ type: 'error', message: 'El nombre del tipo es obligatorio.' });
      return;
    }
    setSaving(true);
    try {
      const dto = {
        name: row.name,
        hourRate: row.hourRate || 0,
        dayMax: row.dayMax || 0,
        monthRate: row.monthRate || 0,
        capacity: row.capacity || 0,
      };
      if (row.id) await updateVehicleType(row.id, dto);
      else await createVehicleType(dto);
      await onChanged();
      setAlert({ type: 'success', message: 'Tipo de vehículo guardado.' });
    } catch (e) {
      setAlert({ type: 'error', message: e?.message || 'No se pudo guardar.' });
    } finally {
      setSaving(false);
    }
  };

  const removeRow = async (i) => {
    const row = rows[i];
    if (!row.id) {
      setRows((r) => r.filter((_, idx) => idx !== i));
      return;
    }
    if (!confirm(`¿Eliminar el tipo "${row.name}"?`)) return;
    try {
      await deleteVehicleType(row.id);
      await onChanged();
    } catch (e) {
      setAlert({ type: 'error', message: e?.message || 'No se pudo eliminar.' });
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await updateParkingSettings({
        graceMinutes: Number(grace) || 0,
        roundUpToHour: roundUp,
      });
      await onChanged();
      setAlert({ type: 'success', message: 'Configuración guardada.' });
    } catch (e) {
      setAlert({ type: 'error', message: e?.message || 'No se pudo guardar.' });
    } finally {
      setSaving(false);
    }
  };

  const cell =
    'w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-orange-400 focus:outline-none';

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-gray-800">
            Tipos de vehículo y tarifas
          </p>
          <Button variant="secondary" size="sm" onClick={addRow}>
            <PlusIcon className="mr-1 h-4 w-4" /> Agregar
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-gray-500">
              <tr className="border-b border-gray-100">
                <th className="py-2 pr-3">Tipo</th>
                <th className="py-2 pr-3">$ / hora</th>
                <th className="py-2 pr-3">Tope día</th>
                <th className="py-2 pr-3">Mensualidad</th>
                <th className="py-2 pr-3">Cupos</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((row, i) => (
                <tr key={row.id || `new-${i}`}>
                  <td className="py-2 pr-3">
                    <input
                      value={row.name}
                      onChange={(e) => setCell(i, 'name', e.target.value)}
                      placeholder="Carro, Moto…"
                      className={`${cell} min-w-[120px]`}
                    />
                  </td>
                  {['hourRate', 'dayMax', 'monthRate', 'capacity'].map((k) => (
                    <td key={k} className="py-2 pr-3">
                      <input
                        type="number"
                        min={0}
                        value={row[k] ?? ''}
                        onChange={(e) => setCell(i, k, e.target.value)}
                        className={`${cell} w-24`}
                      />
                    </td>
                  ))}
                  <td className="py-2 pr-3">
                    <div className="flex gap-1">
                      <Button
                        variant="primary"
                        size="sm"
                        loading={saving}
                        onClick={() => saveRow(i)}
                      >
                        Guardar
                      </Button>
                      <button
                        onClick={() => removeRow(i)}
                        className="rounded-lg border border-gray-200 p-2 text-gray-400 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-gray-400">
          El cobro = tiempo × $/hora (primera hora mínima, luego por fracción),
          con tope por día si lo defines. Mensualidad: para clientes recurrentes.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-gray-800">
          <Cog6ToothIcon className="h-4 w-4 text-orange-500" /> Configuración
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Minutos de gracia (sin cobro)
            </label>
            <input
              type="number"
              min={0}
              value={grace}
              onChange={(e) => setGrace(e.target.value)}
              className={cell}
            />
          </div>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={roundUp}
              onChange={(e) => setRoundUp(e.target.checked)}
              className="h-4 w-4 accent-orange-500"
            />
            Cobrar hora completa (sin fracción)
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="primary" loading={saving} onClick={saveSettings}>
            Guardar configuración
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ParkingPage() {
  return (
    <RoleGuard
      allowedRoles={[
        Roles.SUPER_ADMIN,
        Roles.ADMIN,
        Roles.RECEPCIONISTA,
        Roles.ASESOR,
        Roles.CAJA,
      ]}
    >
      <ParkingInner />
    </RoleGuard>
  );
}
