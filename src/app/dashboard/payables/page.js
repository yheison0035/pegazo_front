'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PlusIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  PencilSquareIcon,
  ArrowUturnLeftIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import Button from '@/components/ui/Button';
import MoneyInput from '@/components/ui/MoneyInput';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { useAuth } from '@/context/authContext';
import { formatCOP } from '@/lib/api/utils/utils';
import { getLocals } from '@/lib/api/routes/locals';
import {
  getPayables,
  getPayablesSummary,
  createPayable,
  payPayable,
  unpayPayable,
  updatePayable,
  deletePayable,
} from '@/lib/api/routes/payables';

const TYPES = [
  { id: 'ARRIENDO', label: 'Arriendo' },
  { id: 'SERVICIOS_PUBLICOS', label: 'Servicios públicos' },
  { id: 'EMPLEADOS', label: 'Empleados / nómina' },
  { id: 'TRANSPORTE', label: 'Transporte' },
  { id: 'PEDIDOS', label: 'Pedidos / proveedores' },
  { id: 'PLAN_CELULAR', label: 'Plan celular' },
  { id: 'PLAN_INTERNET', label: 'Plan internet' },
  { id: 'ASEO', label: 'Aseo' },
  { id: 'MANTENIMIENTO', label: 'Mantenimiento' },
  { id: 'PUBLICIDAD', label: 'Publicidad' },
  { id: 'IMPUESTOS', label: 'Impuestos' },
  { id: 'COMISIONES', label: 'Comisiones' },
  { id: 'OTROS', label: 'Otros' },
];
const TYPE_LABEL = Object.fromEntries(TYPES.map((t) => [t.id, t.label]));

const PAY_METHODS = [
  { id: 'EFECTIVO', name: 'Efectivo' },
  { id: 'BANCOLOMBIA', name: 'Bancolombia' },
  { id: 'TRANSFERENCIA', name: 'Transferencia' },
  { id: 'DATAFONO', name: 'Datáfono' },
];

const TABS = [
  { id: 'PENDIENTE', label: 'Por pagar' },
  { id: 'PAGADO', label: 'Pagadas' },
  { id: '', label: 'Todas' },
];

function todayInput() {
  const d = new Date();
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}

// Estado del vencimiento (para color): vencido / próximo / al día.
function dueMeta(p) {
  if (p.status === 'PAGADO') return null;
  if (!p.dueDate) return { cls: 'text-gray-400', label: 'Sin fecha' };
  const due = new Date(p.dueDate);
  const now = new Date();
  const days = Math.round(
    (new Date(due.getFullYear(), due.getMonth(), due.getDate()) -
      new Date(now.getFullYear(), now.getMonth(), now.getDate())) /
      86400000,
  );
  const txt = due.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  if (days < 0)
    return { cls: 'text-red-600 font-semibold', label: `${txt} · vencida` };
  if (days === 0)
    return { cls: 'text-amber-600 font-semibold', label: `${txt} · vence hoy` };
  if (days <= 7)
    return { cls: 'text-amber-600', label: `${txt} · en ${days}d` };
  return { cls: 'text-gray-600', label: txt };
}

const inputCls =
  'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20';

export default function PayablesPage() {
  const { usuario } = useAuth();
  const [tab, setTab] = useState('PENDIENTE');
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [locals, setLocals] = useState([]);
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState({});

  const [form, setForm] = useState(null); // null | {} (crear) | payable (editar)
  const [payTarget, setPayTarget] = useState(null);
  const [payData, setPayData] = useState({
    paidAt: todayInput(),
    paymentMethod: 'EFECTIVO',
  });

  useEffect(() => {
    getLocals({ all: true })
      .then((r) => setLocals(r?.data || []))
      .catch(() => setLocals([]));
  }, []);

  const load = useCallback(async () => {
    try {
      const [l, s] = await Promise.all([
        getPayables({ status: tab, limit: 100 }),
        getPayablesSummary(),
      ]);
      setItems(l?.data || []);
      setSummary(s?.data || null);
    } catch {
      setItems([]);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () =>
    setForm({
      concept: '',
      paidTo: '',
      type: 'PEDIDOS',
      amount: '',
      dueDate: '',
      localId: String(usuario?.localId || locals[0]?.id || ''),
      notes: '',
    });

  const saveForm = async () => {
    if (!form.concept.trim() || !Number(form.amount) || !form.localId) {
      setAlert({ type: 'warning', message: 'Falta concepto, valor o sede.' });
      return;
    }
    setBusy(true);
    try {
      const dto = {
        concept: form.concept.trim(),
        paidTo: form.paidTo.trim() || undefined,
        type: form.type,
        amount: Number(form.amount),
        dueDate: form.dueDate || undefined,
        localId: Number(form.localId),
        notes: form.notes?.trim() || undefined,
      };
      if (form.id) await updatePayable(form.id, dto);
      else await createPayable(dto);
      setForm(null);
      setAlert({ type: 'success', message: 'Guardada correctamente.' });
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo guardar.' });
    } finally {
      setBusy(false);
    }
  };

  const confirmPay = async () => {
    setBusy(true);
    try {
      await payPayable(payTarget.id, {
        paidAt: new Date(payData.paidAt).toISOString(),
        paymentMethod: payData.paymentMethod,
      });
      setPayTarget(null);
      setAlert({
        type: 'success',
        message: 'Pago registrado. Se generó el gasto.',
      });
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo pagar.' });
    } finally {
      setBusy(false);
    }
  };

  const doUnpay = async (p) => {
    setBusy(true);
    try {
      await unpayPayable(p.id);
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message });
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async (p) => {
    setBusy(true);
    try {
      await deletePayable(p.id);
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message });
    } finally {
      setBusy(false);
    }
  };

  const localName = useMemo(() => {
    const m = {};
    locals.forEach((l) => (m[l.id] = l.name));
    return m;
  }, [locals]);

  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'RECEPCIONISTA']}>
      <div className="w-full p-4">
        <div className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Cuentas por pagar
            </h1>
            <p className="text-sm text-gray-500">
              Registra lo que debes pagar con su fecha de vencimiento. Al
              pagarlo se genera el gasto automáticamente.
            </p>
          </div>
          <Button variant="add" icon={PlusIcon} onClick={openCreate}>
            Nueva cuenta
          </Button>
        </div>

        {/* Alerta de vencimientos */}
        {(summary?.overdueCount > 0 || summary?.dueSoonCount > 0) && (
          <div
            className={`mt-4 flex items-start gap-2.5 rounded-2xl border p-3.5 text-sm ${
              summary?.overdueCount > 0
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              {summary?.overdueCount > 0 && (
                <span className="font-semibold">
                  {summary.overdueCount} cuenta(s) vencida(s) por{' '}
                  {formatCOP(summary.overdue)}
                </span>
              )}
              {summary?.overdueCount > 0 && summary?.dueSoonCount > 0 && ' · '}
              {summary?.dueSoonCount > 0 && (
                <span>
                  {summary.dueSoonCount} vence(n) en los próximos 3 días por{' '}
                  {formatCOP(summary.dueSoon)}
                </span>
              )}
              . Revisa y programa el pago a tiempo.
            </p>
          </div>
        )}

        {/* Resumen */}
        <div className="my-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-amber-700">
              <BanknotesIcon className="h-4 w-4" /> Por pagar
            </p>
            <p className="mt-1 text-2xl font-extrabold text-amber-900">
              {formatCOP(summary?.pending || 0)}
            </p>
            <p className="text-xs text-amber-700/70">
              {summary?.count || 0} cuenta(s) pendiente(s)
            </p>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-red-700">
              <ExclamationTriangleIcon className="h-4 w-4" /> Vencido
            </p>
            <p className="mt-1 text-2xl font-extrabold text-red-900">
              {formatCOP(summary?.overdue || 0)}
            </p>
            <p className="text-xs text-red-700/70">Ya pasó su fecha de pago</p>
          </div>
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-orange-700">
              <ExclamationTriangleIcon className="h-4 w-4" /> Vence pronto
            </p>
            <p className="mt-1 text-2xl font-extrabold text-orange-900">
              {formatCOP(summary?.dueSoon || 0)}
            </p>
            <p className="text-xs text-orange-700/70">
              {summary?.dueSoonCount || 0} en los próximos 3 días
            </p>
          </div>
        </div>

        {/* Pestañas */}
        <div className="mb-3 inline-flex rounded-xl border border-gray-200 bg-white p-0.5">
          {TABS.map((tb) => (
            <button
              key={tb.id || 'all'}
              type="button"
              onClick={() => setTab(tb.id)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
                tab === tb.id
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {items.length === 0 ? (
            <p className="py-14 text-center text-sm text-gray-400">
              No hay cuentas {tab === 'PENDIENTE' ? 'por pagar' : ''} aquí.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Concepto</th>
                    <th className="px-4 py-3 text-left">Categoría</th>
                    <th className="px-4 py-3 text-left">Vencimiento</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => {
                    const dm = dueMeta(p);
                    const paid = p.status === 'PAGADO';
                    return (
                      <tr key={p.id} className="border-t border-gray-100">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">
                            {p.concept}
                          </div>
                          {p.paidTo && (
                            <div className="text-xs text-gray-400">
                              {p.paidTo}
                            </div>
                          )}
                          <div className="text-[11px] text-gray-400">
                            {localName[p.localId] || ''}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {TYPE_LABEL[p.type] || p.type}
                        </td>
                        <td className="px-4 py-3">
                          {paid ? (
                            <span className="text-xs text-emerald-600">
                              Pagada{' '}
                              {p.paidAt
                                ? new Date(p.paidAt).toLocaleDateString('es-CO')
                                : ''}
                            </span>
                          ) : (
                            <span className={`text-xs ${dm?.cls}`}>
                              {dm?.label}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {formatCOP(p.amount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              paid
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {paid ? 'Pagada' : 'Por pagar'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {!paid ? (
                              <>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => {
                                    setPayData({
                                      paidAt: todayInput(),
                                      paymentMethod: 'EFECTIVO',
                                    });
                                    setPayTarget(p);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                                >
                                  <CheckCircleIcon className="h-3.5 w-3.5" />
                                  Pagar
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    setForm({
                                      ...p,
                                      amount: p.amount,
                                      dueDate: p.dueDate
                                        ? String(p.dueDate).slice(0, 10)
                                        : '',
                                      localId: String(p.localId),
                                      paidTo: p.paidTo || '',
                                      notes: p.notes || '',
                                    })
                                  }
                                  className="inline-flex items-center rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50"
                                >
                                  <PencilSquareIcon className="h-3.5 w-3.5" />
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => doUnpay(p)}
                                title="Deshacer el pago (borra el gasto)"
                                className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-100"
                              >
                                <ArrowUturnLeftIcon className="h-3.5 w-3.5" />
                                Reabrir
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => doDelete(p)}
                              className="inline-flex items-center rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:border-red-200 hover:text-red-500"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal crear/editar */}
        {form && (
          <Modal
            title={form.id ? 'Editar cuenta por pagar' : 'Nueva cuenta por pagar'}
            onClose={() => setForm(null)}
          >
            <div className="space-y-3">
              <Field label="Concepto *">
                <input
                  value={form.concept}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, concept: e.target.value }))
                  }
                  placeholder="Ej: Arriendo local, pedido proveedor X"
                  className={inputCls}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Proveedor / a quién">
                  <input
                    value={form.paidTo}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, paidTo: e.target.value }))
                    }
                    className={inputCls}
                  />
                </Field>
                <Field label="Categoría">
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, type: e.target.value }))
                    }
                    className={inputCls}
                  >
                    {TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Valor *">
                  <MoneyInput
                    value={form.amount}
                    onChange={(v) => setForm((f) => ({ ...f, amount: v }))}
                    className={inputCls}
                  />
                </Field>
                <Field label="Vence el (opcional)">
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, dueDate: e.target.value }))
                    }
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Sede *">
                <select
                  value={form.localId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, localId: e.target.value }))
                  }
                  className={inputCls}
                >
                  <option value="">Selecciona…</option>
                  {locals.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Notas (opcional)">
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  className={`${inputCls} resize-y`}
                />
              </Field>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setForm(null)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={saveForm} loading={busy}>
                Guardar
              </Button>
            </div>
          </Modal>
        )}

        {/* Modal pagar */}
        {payTarget && (
          <Modal title="Registrar pago" onClose={() => setPayTarget(null)}>
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="font-semibold text-gray-800">{payTarget.concept}</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCOP(payTarget.amount)}
              </p>
            </div>
            <div className="mt-4 space-y-3">
              <Field label="Fecha del pago">
                <input
                  type="date"
                  value={payData.paidAt}
                  onChange={(e) =>
                    setPayData((d) => ({ ...d, paidAt: e.target.value }))
                  }
                  className={inputCls}
                />
              </Field>
              <Field label="Método de pago">
                <div className="grid grid-cols-2 gap-1.5">
                  {PAY_METHODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() =>
                        setPayData((d) => ({ ...d, paymentMethod: m.id }))
                      }
                      className={`rounded-lg border px-2 py-2 text-sm font-medium transition ${
                        payData.paymentMethod === m.id
                          ? 'border-orange-400 bg-orange-50 text-orange-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </Field>
              <p className="text-[11px] text-gray-400">
                Al confirmar, se crea un gasto con esta fecha y la cuenta queda
                como pagada.
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setPayTarget(null)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                icon={CheckCircleIcon}
                onClick={confirmPay}
                loading={busy}
              >
                Confirmar pago
              </Button>
            </div>
          </Modal>
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

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-600">
        {label}
      </label>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
