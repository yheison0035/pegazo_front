'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PlusIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  PrinterIcon,
  XMarkIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import Button from '@/components/ui/Button';
import MoneyInput from '@/components/ui/MoneyInput';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { useAuth } from '@/context/authContext';
import { formatCOP } from '@/lib/api/utils/utils';
import { getUsers } from '@/lib/api/routes/users';
import {
  getEmployeeCharges,
  getEmployeeChargesSummary,
  createEmployeeCharge,
  settleEmployeeCharge,
  unsettleEmployeeCharge,
  deleteEmployeeCharge,
} from '@/lib/api/routes/employeeCharges';

const TYPES = [
  { id: 'MEMBRESIA', label: 'Error de membresía' },
  { id: 'PRESTAMO', label: 'Préstamo' },
  { id: 'PRODUCTO', label: 'Producto' },
  { id: 'OTRO', label: 'Otro' },
];
const TYPE_LABEL = Object.fromEntries(TYPES.map((t) => [t.id, t.label]));

const STATUS_META = {
  PENDIENTE: { label: 'Pendiente', cls: 'bg-amber-100 text-amber-800' },
  PAGADO: { label: 'Pagado (efectivo)', cls: 'bg-emerald-100 text-emerald-700' },
  DESCONTADO: { label: 'Descontado de comisión', cls: 'bg-blue-100 text-blue-700' },
};

const OWNER_ROLES = ['SUPER_ADMIN', 'ADMIN'];

export default function EmployeeChargesPage() {
  const { usuario } = useAuth();
  const isOwner = OWNER_ROLES.includes(usuario?.role);

  const [employees, setEmployees] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [charges, setCharges] = useState([]);
  const [summary, setSummary] = useState(null);
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState({});
  // Modal para saldar un cargo eligiendo la fecha del pago.
  const [settleTarget, setSettleTarget] = useState(null); // {charge, method}
  const [settleDate, setSettleDate] = useState('');

  const [form, setForm] = useState({
    type: 'OTRO',
    concept: '',
    amount: '',
    notes: '',
  });

  // El dueño elige empleado; el empleado solo ve lo suyo.
  const effectiveUserId = isOwner ? selectedUser : usuario?.id;

  useEffect(() => {
    if (!isOwner) return;
    getUsers({ limit: 200 })
      .then((r) => setEmployees(r?.data || []))
      .catch(() => setEmployees([]));
  }, [isOwner]);

  const load = useCallback(async () => {
    try {
      const [c, s] = await Promise.all([
        getEmployeeCharges(effectiveUserId ? { userId: effectiveUserId } : {}),
        getEmployeeChargesSummary(isOwner ? effectiveUserId : undefined),
      ]);
      setCharges(c?.data || []);
      setSummary(s?.data || null);
    } catch {
      setCharges([]);
      setSummary(null);
    }
  }, [effectiveUserId, isOwner]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!selectedUser) {
      setAlert({ type: 'warning', message: 'Elige el empleado primero.' });
      return;
    }
    if (!form.concept.trim() || !Number(form.amount)) {
      setAlert({ type: 'warning', message: 'Falta concepto o valor.' });
      return;
    }
    setBusy(true);
    try {
      await createEmployeeCharge({
        userId: Number(selectedUser),
        type: form.type,
        concept: form.concept.trim(),
        amount: Number(form.amount),
        notes: form.notes.trim() || undefined,
      });
      setForm({ type: 'OTRO', concept: '', amount: '', notes: '' });
      setAlert({ type: 'success', message: 'Cargo registrado.' });
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo registrar.' });
    } finally {
      setBusy(false);
    }
  };

  // Abre el modal para saldar eligiendo la FECHA del pago.
  const openSettle = (charge, method) => {
    const d = new Date();
    const off = d.getTimezoneOffset() * 60000;
    setSettleDate(new Date(d.getTime() - off).toISOString().slice(0, 10));
    setSettleTarget({ charge, method });
  };

  const confirmSettle = async () => {
    if (!settleTarget) return;
    setBusy(true);
    try {
      await settleEmployeeCharge(
        settleTarget.charge.id,
        settleTarget.method,
        settleDate ? new Date(settleDate).toISOString() : undefined,
      );
      setSettleTarget(null);
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo saldar.' });
    } finally {
      setBusy(false);
    }
  };

  const reopen = async (id) => {
    setBusy(true);
    try {
      await unsettleEmployeeCharge(id);
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    setBusy(true);
    try {
      await deleteEmployeeCharge(id);
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message });
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20';

  const empName = useMemo(() => {
    const e = employees.find((x) => String(x.id) === String(selectedUser));
    return e?.name || '';
  }, [employees, selectedUser]);

  // Imprime la lista de cargos (deudas) tal como se ve, con el total pendiente.
  const printCharges = () => {
    const STATUS_TXT = {
      PENDIENTE: 'Pendiente',
      PAGADO: 'Pagado (efectivo)',
      DESCONTADO: 'Descontado de comisión',
    };
    const titulo = empName ? `Cargos de ${empName}` : 'Cargos a empleados';
    const rows = charges
      .map(
        (c) => `<tr>
          <td>${c.userName || ''}</td>
          <td>${c.concept || ''}</td>
          <td>${TYPE_LABEL[c.type] || c.type}</td>
          <td style="text-align:right">${formatCOP(c.amount)}</td>
          <td>${STATUS_TXT[c.status] || c.status}</td>
          <td>${new Date(c.createdAt).toLocaleDateString('es-CO')}</td>
        </tr>`,
      )
      .join('');
    const pend = charges
      .filter((c) => c.status === 'PENDIENTE')
      .reduce((s, c) => s + c.amount, 0);
    const negocio = usuario?.company?.name || '';
    const w = window.open('', '_blank', 'width=800,height=600');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${titulo}</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;color:#111827;padding:24px;}
        h1{font-size:18px;margin:0 0 2px;} .sub{color:#6b7280;font-size:12px;margin:0 0 16px;}
        table{width:100%;border-collapse:collapse;font-size:12px;}
        th,td{border:1px solid #e5e7eb;padding:6px 8px;text-align:left;}
        th{background:#f9fafb;}
        .tot{margin-top:14px;font-size:14px;font-weight:bold;text-align:right;}
      </style></head><body>
      <h1>${titulo}</h1>
      <p class="sub">${negocio} · ${new Date().toLocaleDateString('es-CO')}</p>
      <table><thead><tr>
        <th>Empleado</th><th>Concepto</th><th>Tipo</th><th style="text-align:right">Valor</th><th>Estado</th><th>Fecha</th>
      </tr></thead><tbody>${rows || '<tr><td colspan="6">Sin cargos</td></tr>'}</tbody></table>
      <p class="tot">Total pendiente: ${formatCOP(pend)}</p>
      </body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'BARBERO', 'PROFESIONAL']}>
      <div className="w-full p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold text-gray-800">
            Cargos a empleados
          </h1>
          {charges.length > 0 && (
            <button
              type="button"
              onClick={printCharges}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <PrinterIcon className="h-4 w-4" />
              Imprimir
            </button>
          )}
        </div>
        <p className="mb-5 text-sm text-gray-500">
          {isOwner
            ? 'Valores que el empleado debe responder (error de membresía, préstamo, producto…). Puedes marcarlos pagados en efectivo o descontarlos de sus comisiones.'
            : 'Estos son los valores que debes responder al negocio.'}
        </p>

        {/* Selector de empleado (dueño) */}
        {isOwner && (
          <div className="mb-4 max-w-sm">
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Empleado
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className={inputCls}
            >
              <option value="">— Todos —</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} {e.role ? `· ${e.role}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Saldo */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase text-amber-700">
              Saldo pendiente
            </p>
            <p className="mt-1 text-2xl font-extrabold text-amber-900">
              {formatCOP(summary?.pending || 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase text-emerald-700">
              Pagado en efectivo
            </p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-900">
              {formatCOP(summary?.paid || 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-semibold uppercase text-blue-700">
              Descontado de comisión
            </p>
            <p className="mt-1 text-2xl font-extrabold text-blue-900">
              {formatCOP(summary?.discounted || 0)}
            </p>
          </div>
        </div>

        {/* Nuevo cargo (dueño) */}
        {isOwner && (
          <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="mb-3 font-semibold text-gray-800">
              Nuevo cargo {empName ? `para ${empName}` : ''}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Tipo
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className={inputCls}
                >
                  {TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="lg:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Concepto
                </label>
                <input
                  value={form.concept}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, concept: e.target.value }))
                  }
                  placeholder="Ej: Corte membresía mal aplicado"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Valor
                </label>
                <MoneyInput
                  value={form.amount}
                  onChange={(v) => setForm((f) => ({ ...f, amount: v }))}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="mt-3 flex items-end gap-3">
              <div className="flex-1">
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
              <Button
                variant="add"
                icon={PlusIcon}
                onClick={add}
                loading={busy}
              >
                Agregar cargo
              </Button>
            </div>
          </div>
        )}

        {/* Lista de cargos */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {charges.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400">
              Sin cargos registrados.
            </p>
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  {isOwner && <th className="px-4 py-3 text-left">Empleado</th>}
                  <th className="px-4 py-3 text-left">Concepto</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  {isOwner && <th className="px-4 py-3 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {charges.map((c) => {
                  const meta = STATUS_META[c.status] || {
                    label: c.status,
                    cls: 'bg-gray-100 text-gray-700',
                  };
                  return (
                    <tr key={c.id} className="border-t border-gray-100">
                      {isOwner && (
                        <td className="px-4 py-3 font-medium text-gray-700">
                          {c.userName || `#${c.userId}`}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">
                          {c.concept}
                        </div>
                        {c.notes && (
                          <div className="text-xs text-gray-400">{c.notes}</div>
                        )}
                        <div className="text-[11px] text-gray-400">
                          {new Date(c.createdAt).toLocaleDateString('es-CO')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {TYPE_LABEL[c.type] || c.type}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {formatCOP(c.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.cls}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      {isOwner && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {c.status === 'PENDIENTE' ? (
                              <>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => openSettle(c, 'EFECTIVO')}
                                  title="Pagó en efectivo"
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                                >
                                  <BanknotesIcon className="h-3.5 w-3.5" />
                                  Efectivo
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => openSettle(c, 'COMISION')}
                                  title="Descontar de su comisión"
                                  className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                                >
                                  <ReceiptPercentIcon className="h-3.5 w-3.5" />
                                  Comisión
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => reopen(c.id)}
                                title="Reabrir"
                                className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                              >
                                <ArrowUturnLeftIcon className="h-3.5 w-3.5" />
                                Reabrir
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => remove(c.id)}
                              title="Eliminar"
                              className="inline-flex items-center rounded-lg border border-gray-200 p-1 text-gray-400 hover:border-red-200 hover:text-red-500 disabled:opacity-50"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal: saldar cargo eligiendo la fecha del pago */}
        {settleTarget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setSettleTarget(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">
                  {settleTarget.method === 'EFECTIVO'
                    ? 'Pago en efectivo'
                    : 'Descontar de comisión'}
                </h2>
                <button
                  onClick={() => setSettleTarget(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="font-semibold text-gray-800">
                  {settleTarget.charge.concept}
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCOP(settleTarget.charge.amount)}
                </p>
              </div>
              <div className="mt-4">
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Fecha del pago
                </label>
                <input
                  type="date"
                  value={settleDate}
                  onChange={(e) => setSettleDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Elige el día en que realmente pagó, para que quede en el
                  reporte de ese periodo.
                </p>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setSettleTarget(null)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  icon={CheckCircleIcon}
                  onClick={confirmSettle}
                  loading={busy}
                >
                  Confirmar
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
