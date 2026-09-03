'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  BriefcaseIcon,
  PlusIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { formatCOP, formatDateTime } from '@/lib/api/utils/utils';
import {
  getFiscalStatus,
  getFiscalDocuments,
  emitFiscalPayroll,
  replaceFiscalPayroll,
  eliminateFiscalPayroll,
} from '@/lib/api/routes/fiscal';

export default function NominaElectronicaPage() {
  return (
    <RoleGuard allowedRoles={[Roles.SUPER_ADMIN, Roles.ADMIN]}>
      <NominaElectronica />
    </RoleGuard>
  );
}

function NominaElectronica() {
  const [loading, setLoading] = useState(true);
  const [linked, setLinked] = useState(false);
  const [docs, setDocs] = useState([]);
  const [alert, setAlert] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [replaceId, setReplaceId] = useState(null);

  const handleEliminate = async (d) => {
    const reason = window.prompt(
      `Eliminar (nota de ajuste) la nómina ${d.number || ''}. Escribe el motivo:`,
      'Nómina enviada por error',
    );
    if (reason === null) return;
    try {
      const r = await eliminateFiscalPayroll(d.id, reason || 'Eliminación');
      setAlert({ type: 'success', message: `Nota de ajuste ${r?.number || ''} (eliminación) emitida.` });
      await load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message });
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [st, d] = await Promise.all([
        getFiscalStatus().catch(() => null),
        getFiscalDocuments({ type: 'NOMINA', limit: 20 }).catch(() => null),
      ]);
      setLinked(!!st?.data?.linked);
      setDocs(d?.data || []);
    } catch (e) {
      setAlert({ type: 'error', message: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="relative min-h-[60vh] w-full">
        <LoadingOverlay show text="Cargando nómina electrónica..." />
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow">
              <BriefcaseIcon className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-semibold text-gray-800">
              Nómina Electrónica
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Documento Soporte de Pago de Nómina ante la DIAN, por empleado
          </p>
        </div>
        {linked && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={ArrowPathIcon} onClick={load}>
              Actualizar
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={PlusIcon}
              onClick={() => {
                setReplaceId(null);
                setShowModal(true);
              }}
            >
              Emitir nómina
            </Button>
          </div>
        )}
      </div>

      {!linked ? (
        <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="font-semibold text-amber-800">
            Primero activa la facturación electrónica
          </p>
          <p className="mt-1 text-sm text-amber-700">
            La nómina electrónica usa el mismo enlace con la DIAN. Ve a
            "Facturación electrónica" y actívala; luego podrás emitir la nómina.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3 font-semibold">Número</th>
                  <th className="px-4 py-3 font-semibold">Empleado</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {docs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-14 text-center">
                      <BriefcaseIcon className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                      <p className="text-sm text-gray-500">
                        Aún no has emitido nómina electrónica.
                      </p>
                    </td>
                  </tr>
                )}
                {docs.map((d) => (
                  <tr key={d.id} className="border-b border-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800">
                      {d.number || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {d.customer || '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-gray-800">
                      {formatCOP(d.total || 0)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDateTime(d.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setReplaceId(d.id);
                            setShowModal(true);
                          }}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-amber-600 transition hover:bg-amber-50"
                          title="Corregir con nota de ajuste (reemplazo)"
                        >
                          Corregir
                        </button>
                        <button
                          onClick={() => handleEliminate(d)}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                          title="Eliminar con nota de ajuste"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <PayrollModal
          replaceId={replaceId}
          onClose={() => {
            setShowModal(false);
            setReplaceId(null);
          }}
          onSaved={async (r) => {
            setShowModal(false);
            setReplaceId(null);
            setAlert({
              type: 'success',
              message: replaceId
                ? `Nota de ajuste ${r?.number || ''} (reemplazo) emitida.`
                : `Nómina ${r?.number || ''} emitida para ${r?.employee || ''}.`,
            });
            await load();
          }}
          onError={(m) => setAlert({ type: 'error', message: m })}
        />
      )}

      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({})}
      />
    </div>
  );
}

function PayrollModal({ onClose, onSaved, onError, replaceId }) {
  const today = new Date().toISOString().slice(0, 10);
  const [emp, setEmp] = useState({
    name: '',
    identification: '',
    position: '',
    salary: '',
  });
  const [period, setPeriod] = useState({ startDate: '', endDate: today });
  const [earnings, setEarnings] = useState([{ concept: 'Sueldo', amount: '' }]);
  const [deductions, setDeductions] = useState([
    { concept: 'Salud (4%)', amount: '' },
    { concept: 'Pensión (4%)', amount: '' },
  ]);
  const [saving, setSaving] = useState(false);

  const totalDev = earnings.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const totalDed = deductions.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const totalPay = totalDev - totalDed;

  const submit = async () => {
    if (!emp.name.trim() || !emp.identification.trim()) {
      onError('Ingresa el nombre y el documento del empleado.');
      return;
    }
    setSaving(true);
    try {
      const clean = (arr) =>
        arr
          .filter((l) => l.concept.trim() && Number(l.amount) > 0)
          .map((l) => ({ concept: l.concept.trim(), amount: Number(l.amount) }));
      const payload = {
        employee: {
          name: emp.name.trim(),
          identification: emp.identification.trim(),
          position: emp.position.trim() || undefined,
          salary: Number(emp.salary) || undefined,
        },
        period,
        earnings: clean(earnings),
        deductions: clean(deductions),
      };
      const r = replaceId
        ? await replaceFiscalPayroll(replaceId, payload)
        : await emitFiscalPayroll(payload);
      onSaved(r);
    } catch (e) {
      onError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-800">
            {replaceId ? 'Corregir nómina (nota de ajuste)' : 'Emitir nómina electrónica'}
          </h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* Empleado */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre del empleado" className="col-span-2">
              <input
                value={emp.name}
                onChange={(e) => setEmp({ ...emp, name: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Documento">
              <input
                value={emp.identification}
                onChange={(e) =>
                  setEmp({ ...emp, identification: e.target.value })
                }
                className={inputCls}
              />
            </Field>
            <Field label="Cargo">
              <input
                value={emp.position}
                onChange={(e) => setEmp({ ...emp, position: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Período desde">
              <input
                type="date"
                value={period.startDate}
                onChange={(e) =>
                  setPeriod({ ...period, startDate: e.target.value })
                }
                className={inputCls}
              />
            </Field>
            <Field label="Período hasta">
              <input
                type="date"
                value={period.endDate}
                onChange={(e) =>
                  setPeriod({ ...period, endDate: e.target.value })
                }
                className={inputCls}
              />
            </Field>
          </div>

          <ConceptEditor
            title="Devengados"
            lines={earnings}
            setLines={setEarnings}
            color="emerald"
          />
          <ConceptEditor
            title="Deducciones"
            lines={deductions}
            setLines={setDeductions}
            color="red"
          />

          <div className="rounded-xl bg-gray-50 p-3 text-sm">
            <Row label="Total devengado" value={formatCOP(totalDev)} />
            <Row label="Total deducciones" value={`− ${formatCOP(totalDed)}`} />
            <div className="mt-1 flex justify-between border-t border-gray-200 pt-1 font-bold text-gray-900">
              <span>Neto a pagar</span>
              <span>{formatCOP(totalPay)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <Button variant="clear" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" icon={PlusIcon} loading={saving} onClick={submit}>
            Emitir nómina
          </Button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20';

function Field({ label, className = '', children }) {
  return (
    <label className={`flex flex-col text-sm ${className}`}>
      <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-gray-600">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function ConceptEditor({ title, lines, setLines, color }) {
  const set = (i, k, v) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, [k]: v } : l)));
  const add = () => setLines((ls) => [...ls, { concept: '', amount: '' }]);
  const remove = (i) => setLines((ls) => ls.filter((_, idx) => idx !== i));
  const dot = color === 'emerald' ? 'bg-emerald-500' : 'bg-red-500';
  return (
    <div>
      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
        <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
        {title}
      </p>
      <div className="space-y-1.5">
        {lines.map((l, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={l.concept}
              onChange={(e) => set(i, 'concept', e.target.value)}
              placeholder="Concepto"
              className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
            <input
              type="number"
              value={l.amount}
              onChange={(e) => set(i, 'amount', e.target.value)}
              placeholder="Valor"
              className="w-28 rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
            {lines.length > 1 && (
              <button
                onClick={() => remove(i)}
                className="grid h-8 w-8 flex-none place-items-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={add}
        className="mt-1 text-xs font-medium text-orange-600 hover:underline"
      >
        + Agregar {title.toLowerCase()}
      </button>
    </div>
  );
}
