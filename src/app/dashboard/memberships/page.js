'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useLiveRefresh from "@/hooks/useLiveRefresh";
import {
  PlusIcon,
  BanknotesIcon,
  CheckCircleIcon,
  XMarkIcon,
  PencilSquareIcon,
  TrashIcon,
  CalendarDaysIcon,
  ArrowUturnLeftIcon,
  ClockIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import { useAuth } from '@/context/authContext';
import Button from '@/components/ui/Button';
import MoneyInput from '@/components/ui/MoneyInput';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { formatCOP } from '@/lib/api/utils/utils';
import { getTerms } from '@/config/terminology';
import { getCustomers } from '@/lib/api/routes/customers';
import {
  getMemberships,
  createMembership,
  updateMembership,
  deleteMembership,
  chargeMembership,
  unchargeMembership,
} from '@/lib/api/routes/memberships';

const PAY_METHODS = [
  { id: '', label: 'Sin especificar' },
  { id: 'EFECTIVO', label: 'Efectivo' },
  { id: 'TRANSFERENCIA', label: 'Transferencia' },
  { id: 'BANCOLOMBIA', label: 'Bancolombia' },
  { id: 'DATAFONO', label: 'Datáfono' },
];

const todayISO = () => {
  const d = new Date();
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
};

const EMPTY_FORM = {
  name: '',
  amount: '',
  dueDay: '',
  customerId: '',
  notes: '',
};

export default function MembershipsPage() {
  const { usuario } = useAuth();
  const isOwner = ['SUPER_ADMIN', 'ADMIN'].includes(usuario?.role);
  const terms = useMemo(
    () => getTerms(usuario?.company || {}),
    [usuario?.company],
  );

  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState({});

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);

  const [payTarget, setPayTarget] = useState(null);
  const [payForm, setPayForm] = useState({
    amount: '',
    paidDate: todayISO(),
    paymentMethod: '',
    notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMemberships();
      setItems(res?.data || []);
      setSummary(res?.summary || null);
    } catch {
      setItems([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    getCustomers({ limit: 500 })
      .then((r) => setCustomers(r?.data || []))
      .catch(() => setCustomers([]));
  }, [load]);

  // Datos en vivo: refresca al volver a la pestana/foco y cada 20s.
  useLiveRefresh(load);

  const inputCls =
    'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20';

  const openNew = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (m) => {
    setEditId(m.id);
    setForm({
      name: m.name || '',
      amount: m.amount ?? '',
      dueDay: m.dueDay ?? '',
      customerId: m.customerId ? String(m.customerId) : '',
      notes: m.notes || '',
    });
    setShowForm(true);
  };

  const saveForm = async () => {
    if (!form.name.trim() || !Number(form.amount)) {
      setAlert({ type: 'warning', message: 'Falta el nombre del plan o el monto.' });
      return;
    }
    setBusy(true);
    try {
      const dto = {
        name: form.name.trim(),
        amount: Number(form.amount),
        dueDay: form.dueDay ? Number(form.dueDay) : undefined,
        customerId: form.customerId ? Number(form.customerId) : undefined,
        notes: form.notes.trim() || undefined,
      };
      if (editId) await updateMembership(editId, dto);
      else await createMembership(dto);
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditId(null);
      setAlert({
        type: 'success',
        message: editId ? 'Membresía actualizada.' : 'Membresía creada.',
      });
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo guardar.' });
    } finally {
      setBusy(false);
    }
  };

  const removeItem = async (m) => {
    if (!window.confirm(`¿Eliminar la membresía "${m.name}"?`)) return;
    setBusy(true);
    try {
      await deleteMembership(m.id);
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message });
    } finally {
      setBusy(false);
    }
  };

  const openPay = (m) => {
    setPayTarget(m);
    setPayForm({
      amount: m.amount ?? '',
      paidDate: todayISO(),
      paymentMethod: '',
      notes: '',
    });
  };

  const confirmPay = async () => {
    if (!payTarget) return;
    if (!payForm.paidDate) {
      setAlert({ type: 'warning', message: 'Elige la fecha del cobro.' });
      return;
    }
    setBusy(true);
    try {
      await chargeMembership(payTarget.id, {
        paidDate: new Date(payForm.paidDate).toISOString(),
        amount: payForm.amount ? Number(payForm.amount) : undefined,
        paymentMethod: payForm.paymentMethod || undefined,
        notes: payForm.notes.trim() || undefined,
      });
      setPayTarget(null);
      setAlert({ type: 'success', message: 'Cobro registrado.' });
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo cobrar.' });
    } finally {
      setBusy(false);
    }
  };

  const undoPay = async (m) => {
    if (!window.confirm(`¿Deshacer el cobro de "${m.name}" de este mes?`)) return;
    setBusy(true);
    try {
      await unchargeMembership(m.id);
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message });
    } finally {
      setBusy(false);
    }
  };

  const period = summary?.period || '';

  return (
    <RoleGuard allowedRoles={[Roles.SUPER_ADMIN, Roles.ADMIN, Roles.RECEPCIONISTA]}>
      <div className="w-full p-4">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-gray-800">Membresías</h1>
          {isOwner && (
            <Button variant="add" icon={PlusIcon} onClick={openNew}>
              Nueva membresía
            </Button>
          )}
        </div>
        <p className="mb-5 text-sm text-gray-500">
          Mensualidades recurrentes de tus {terms.customerPlural?.toLowerCase() || 'clientes'}
          . Cóbralas cada mes con su fecha y observación; el estado se actualiza solo.
        </p>

        {/* Resumen del mes */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-500">
              Total mensual
            </p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">
              {formatCOP(summary?.totalMonthly || 0)}
            </p>
            <p className="mt-0.5 text-[11px] text-gray-400">
              {summary?.count || 0} membresía(s)
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase text-emerald-700">
              Recaudado {period ? `· ${period}` : 'este mes'}
            </p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-900">
              {formatCOP(summary?.collected || 0)}
            </p>
            <p className="mt-0.5 text-[11px] text-emerald-700/70">
              {summary?.upToDate || 0} al día
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase text-amber-700">
              Por cobrar este mes
            </p>
            <p className="mt-1 text-2xl font-extrabold text-amber-900">
              {formatCOP(summary?.overdueAmount || 0)}
            </p>
            <p className="mt-0.5 text-[11px] text-amber-700/70">
              {summary?.overdueCount || 0} vencida(s)
            </p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-semibold uppercase text-blue-700">
              Activas
            </p>
            <p className="mt-1 text-2xl font-extrabold text-blue-900">
              {summary?.count || 0}
            </p>
            <p className="mt-0.5 text-[11px] text-blue-700/70">membresías vigentes</p>
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <p className="py-12 text-center text-sm text-gray-400">Cargando…</p>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-14 text-center">
            <p className="text-sm text-gray-500">
              Aún no tienes membresías registradas.
            </p>
            {isOwner && (
              <p className="mt-1 text-xs text-gray-400">
                Crea la mensualidad de un cliente y cóbrala cada mes.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {items.map((m) => {
              const paid = m.paidThisMonth;
              return (
                <div
                  key={m.id}
                  className={`rounded-2xl border p-4 shadow-sm transition ${
                    paid
                      ? 'border-emerald-200 bg-emerald-50/40'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-800">
                        {m.name}
                      </p>
                      <p className="mt-0.5 text-lg font-extrabold text-gray-900">
                        {formatCOP(m.amount)}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-400">
                        {m.customer?.name ? (
                          <span className="inline-flex items-center gap-1">
                            <UserIcon className="h-3.5 w-3.5" />
                            {m.customer.name}
                          </span>
                        ) : null}
                        {m.dueDay ? (
                          <span className="inline-flex items-center gap-1">
                            <CalendarDaysIcon className="h-3.5 w-3.5" />
                            Se cobra el día {m.dueDay}
                          </span>
                        ) : null}
                      </div>
                      {m.notes && (
                        <p className="mt-1 text-xs text-gray-400">{m.notes}</p>
                      )}
                    </div>

                    {isOwner && (
                      <div className="flex flex-none items-center gap-1">
                        <button
                          type="button"
                          title="Editar"
                          onClick={() => openEdit(m)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Eliminar"
                          onClick={() => removeItem(m)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
                    {paid ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                        <CheckCircleIcon className="h-3.5 w-3.5" />
                        Al día{' '}
                        {m.lastPayment?.paidDate
                          ? `· ${new Date(
                              m.lastPayment.paidDate,
                            ).toLocaleDateString('es-CO')}`
                          : ''}
                        {m.lastPayment?.amount != null
                          ? ` · ${formatCOP(m.lastPayment.amount)}`
                          : ''}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                        <ClockIcon className="h-3.5 w-3.5" />
                        Pendiente este mes
                      </span>
                    )}

                    {paid ? (
                      isOwner && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => undoPay(m)}
                          className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                        >
                          <ArrowUturnLeftIcon className="h-3.5 w-3.5" />
                          Deshacer
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => openPay(m)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <BanknotesIcon className="h-4 w-4" />
                        Cobrar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal nuevo/editar */}
        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowForm(false)}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">
                  {editId ? 'Editar membresía' : 'Nueva membresía'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Nombre del plan
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Ej: Mensualidad guarda cascos, Plan cancha…"
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">
                      Monto mensual
                    </label>
                    <MoneyInput
                      value={form.amount}
                      onChange={(v) => setForm((f) => ({ ...f, amount: v }))}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">
                      Día de cobro (opcional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={form.dueDay}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, dueDay: e.target.value }))
                      }
                      placeholder="Ej: 5"
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Cliente (opcional)
                  </label>
                  <select
                    value={form.customerId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, customerId: e.target.value }))
                    }
                    className={inputCls}
                  >
                    <option value="">— Sin cliente —</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Nota (opcional)
                  </label>
                  <input
                    value={form.notes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  icon={CheckCircleIcon}
                  onClick={saveForm}
                  loading={busy}
                >
                  {editId ? 'Guardar' : 'Crear'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal cobrar */}
        {payTarget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setPayTarget(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">Registrar cobro</h2>
                <button
                  onClick={() => setPayTarget(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <p className="font-semibold text-gray-800">{payTarget.name}</p>
                {payTarget.customer?.name && (
                  <p className="text-xs text-gray-500">
                    {payTarget.customer.name}
                  </p>
                )}
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Monto cobrado
                  </label>
                  <MoneyInput
                    value={payForm.amount}
                    onChange={(v) => setPayForm((f) => ({ ...f, amount: v }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Fecha del cobro
                  </label>
                  <input
                    type="date"
                    value={payForm.paidDate}
                    onChange={(e) =>
                      setPayForm((f) => ({ ...f, paidDate: e.target.value }))
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Método de pago (opcional)
                  </label>
                  <select
                    value={payForm.paymentMethod}
                    onChange={(e) =>
                      setPayForm((f) => ({ ...f, paymentMethod: e.target.value }))
                    }
                    className={inputCls}
                  >
                    {PAY_METHODS.map((pm) => (
                      <option key={pm.id} value={pm.id}>
                        {pm.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Observación (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={payForm.notes}
                    onChange={(e) =>
                      setPayForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    placeholder="Ej: Cobro mes de septiembre"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setPayTarget(null)}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  icon={BanknotesIcon}
                  onClick={confirmPay}
                  loading={busy}
                >
                  Confirmar cobro
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
    </RoleGuard>
  );
}
