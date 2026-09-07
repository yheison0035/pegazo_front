'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/authContext';
import Button from '@/components/ui/Button';
import MoneyInput from '@/components/ui/MoneyInput';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { formatCOP } from '@/lib/api/utils/utils';
import { getExpenseCategories } from '@/lib/api/routes/expenseCategories';
import { getLocals } from '@/lib/api/routes/locals';
import {
  getFixedExpenses,
  createFixedExpense,
  updateFixedExpense,
  deleteFixedExpense,
  payFixedExpense,
  unpayFixedExpense,
} from '@/lib/api/routes/fixedExpenses';

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
  expenseCategoryId: '',
  paidTo: '',
  notes: '',
};

export default function FixedExpensesPanel() {
  const { usuario } = useAuth();
  const isOwner = ['SUPER_ADMIN', 'ADMIN'].includes(usuario?.role);

  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState({});

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);

  const [payTarget, setPayTarget] = useState(null);
  const [payForm, setPayForm] = useState({
    amount: '',
    paymentDate: todayISO(),
    paymentMethod: '',
    notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFixedExpenses();
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
    getExpenseCategories()
      .then((r) => setCategories(r?.data || []))
      .catch(() => setCategories([]));
  }, [load]);

  const inputCls =
    'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20';

  const openNew = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (fx) => {
    setEditId(fx.id);
    setForm({
      name: fx.name || '',
      amount: fx.amount ?? '',
      dueDay: fx.dueDay ?? '',
      expenseCategoryId: fx.expenseCategoryId ? String(fx.expenseCategoryId) : '',
      paidTo: fx.paidTo || '',
      notes: fx.notes || '',
    });
    setShowForm(true);
  };

  const saveForm = async () => {
    if (!form.name.trim() || !Number(form.amount)) {
      setAlert({ type: 'warning', message: 'Falta el nombre o el monto.' });
      return;
    }
    setBusy(true);
    try {
      const dto = {
        name: form.name.trim(),
        amount: Number(form.amount),
        dueDay: form.dueDay ? Number(form.dueDay) : undefined,
        expenseCategoryId: form.expenseCategoryId
          ? Number(form.expenseCategoryId)
          : undefined,
        paidTo: form.paidTo.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };
      if (editId) await updateFixedExpense(editId, dto);
      else await createFixedExpense(dto);
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditId(null);
      setAlert({
        type: 'success',
        message: editId ? 'Gasto fijo actualizado.' : 'Gasto fijo creado.',
      });
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo guardar.' });
    } finally {
      setBusy(false);
    }
  };

  const removeFixed = async (fx) => {
    if (!window.confirm(`¿Eliminar el gasto fijo "${fx.name}"?`)) return;
    setBusy(true);
    try {
      await deleteFixedExpense(fx.id);
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message });
    } finally {
      setBusy(false);
    }
  };

  const openPay = (fx) => {
    setPayTarget(fx);
    setPayForm({
      amount: fx.amount ?? '',
      paymentDate: todayISO(),
      paymentMethod: '',
      notes: '',
    });
  };

  const confirmPay = async () => {
    if (!payTarget) return;
    if (!payForm.paymentDate) {
      setAlert({ type: 'warning', message: 'Elige la fecha del pago.' });
      return;
    }
    setBusy(true);
    try {
      await payFixedExpense(payTarget.id, {
        paymentDate: new Date(payForm.paymentDate).toISOString(),
        amount: payForm.amount ? Number(payForm.amount) : undefined,
        paymentMethod: payForm.paymentMethod || undefined,
        notes: payForm.notes.trim() || undefined,
      });
      setPayTarget(null);
      setAlert({ type: 'success', message: 'Pago registrado.' });
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo pagar.' });
    } finally {
      setBusy(false);
    }
  };

  const undoPay = async (fx) => {
    if (!window.confirm(`¿Deshacer el pago de "${fx.name}" de este mes?`)) return;
    setBusy(true);
    try {
      await unpayFixedExpense(fx.id);
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message });
    } finally {
      setBusy(false);
    }
  };

  const period = summary?.period || '';

  const catName = useMemo(() => {
    const m = {};
    categories.forEach((c) => (m[c.id] = c.name));
    return m;
  }, [categories]);

  return (
    <div>
      {/* Resumen del mes */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-500">
            Total fijo mensual
          </p>
          <p className="mt-1 text-2xl font-extrabold text-gray-900">
            {formatCOP(summary?.totalFixed || 0)}
          </p>
          <p className="mt-0.5 text-[11px] text-gray-400">
            {summary?.count || 0} gasto(s) fijo(s)
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase text-emerald-700">
            Pagado {period ? `· ${period}` : 'este mes'}
          </p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-900">
            {formatCOP(summary?.paidAmount || 0)}
          </p>
          <p className="mt-0.5 text-[11px] text-emerald-700/70">
            {summary?.paidCount || 0} pagado(s)
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase text-amber-700">
            Pendiente por pagar
          </p>
          <p className="mt-1 text-2xl font-extrabold text-amber-900">
            {formatCOP(summary?.pendingAmount || 0)}
          </p>
          <p className="mt-0.5 text-[11px] text-amber-700/70">
            {summary?.pendingCount || 0} pendiente(s)
          </p>
        </div>
      </div>

      {isOwner && (
        <div className="mb-4 flex justify-end">
          <Button variant="add" icon={PlusIcon} onClick={openNew}>
            Nuevo gasto fijo
          </Button>
        </div>
      )}

      {/* Lista de gastos fijos */}
      {loading ? (
        <p className="py-12 text-center text-sm text-gray-400">Cargando…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-14 text-center">
          <p className="text-sm text-gray-500">
            Aún no tienes gastos fijos registrados.
          </p>
          {isOwner && (
            <p className="mt-1 text-xs text-gray-400">
              Agrega tu arriendo, servicios, internet, plan celular… y márcalos
              como pagados cada mes.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {items.map((fx) => {
            const paid = fx.paidThisMonth;
            return (
              <div
                key={fx.id}
                className={`rounded-2xl border p-4 shadow-sm transition ${
                  paid
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-gray-800">
                        {fx.name}
                      </p>
                      {fx.expenseCategoryId && (
                        <span className="whitespace-nowrap rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-gray-500">
                          {fx.expenseCategory?.name ||
                            catName[fx.expenseCategoryId]}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-lg font-extrabold text-gray-900">
                      {formatCOP(fx.amount)}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-400">
                      {fx.dueDay ? (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDaysIcon className="h-3.5 w-3.5" />
                          Se paga el día {fx.dueDay}
                        </span>
                      ) : null}
                      {fx.paidTo ? <span>· {fx.paidTo}</span> : null}
                    </div>
                    {fx.notes && (
                      <p className="mt-1 text-xs text-gray-400">{fx.notes}</p>
                    )}
                  </div>

                  {isOwner && (
                    <div className="flex flex-none items-center gap-1">
                      <button
                        type="button"
                        title="Editar"
                        onClick={() => openEdit(fx)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Eliminar"
                        onClick={() => removeFixed(fx)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Estado + acción de pago */}
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
                  {paid ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                      Pagado{' '}
                      {fx.lastPayment?.expenseDate
                        ? `el ${new Date(
                            fx.lastPayment.expenseDate,
                          ).toLocaleDateString('es-CO')}`
                        : ''}
                      {fx.lastPayment?.amount != null
                        ? ` · ${formatCOP(fx.lastPayment.amount)}`
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
                        onClick={() => undoPay(fx)}
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
                      onClick={() => openPay(fx)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <BanknotesIcon className="h-4 w-4" />
                      Pagar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: nuevo/editar gasto fijo */}
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
                {editId ? 'Editar gasto fijo' : 'Nuevo gasto fijo'}
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
                  Nombre
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Ej: Arriendo local, Internet, Energía…"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Monto
                  </label>
                  <MoneyInput
                    value={form.amount}
                    onChange={(v) => setForm((f) => ({ ...f, amount: v }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Día de pago (opcional)
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
                  Tipo de gasto
                </label>
                <select
                  value={form.expenseCategoryId}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      expenseCategoryId: e.target.value,
                    }))
                  }
                  className={inputCls}
                >
                  <option value="">— Sin tipo —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Pagado a (opcional)
                </label>
                <input
                  value={form.paidTo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, paidTo: e.target.value }))
                  }
                  placeholder="Ej: EPM, Claro, propietario…"
                  className={inputCls}
                />
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

      {/* Modal: pagar gasto fijo */}
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
              <h2 className="text-lg font-bold text-gray-800">Registrar pago</h2>
              <button
                onClick={() => setPayTarget(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl bg-gray-50 p-3">
              <p className="font-semibold text-gray-800">{payTarget.name}</p>
              {payTarget.paidTo && (
                <p className="text-xs text-gray-500">{payTarget.paidTo}</p>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Monto pagado
                </label>
                <MoneyInput
                  value={payForm.amount}
                  onChange={(v) => setPayForm((f) => ({ ...f, amount: v }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Fecha del pago
                </label>
                <input
                  type="date"
                  value={payForm.paymentDate}
                  onChange={(e) =>
                    setPayForm((f) => ({ ...f, paymentDate: e.target.value }))
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
                  {PAY_METHODS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
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
                  placeholder="Ej: Pago mes de septiembre"
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
                Confirmar pago
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
