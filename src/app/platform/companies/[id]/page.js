'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRightEndOnRectangleIcon,
  PencilSquareIcon,
  PowerIcon,
  ArrowPathIcon,
  BuildingStorefrontIcon,
  UsersIcon,
  BanknotesIcon,
  MapPinIcon,
  ArrowLeftIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

import RoleGuard from '@/auth/roleGuard';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import Button from '@/components/ui/Button';
import TableActionButton from '@/components/ui/TableActionButton';
import { formatDateOnly } from '@/lib/api/utils/utils';
import { enterAsCompany } from '@/lib/impersonation';
import {
  getCompanyDetail,
  renewCompany,
  setCompanyStatus,
} from '@/lib/api/routes/companies';
import {
  platformCreateUser,
  platformUpdateUser,
  platformResetUserPassword,
} from '@/lib/api/routes/users';

const ASSIGNABLE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'COORDINADOR',
  'ASESOR',
  'AUXILIAR',
  'BODEGUERO',
  'VENTAS',
  'CAJA',
  'RECEPCIONISTA',
  'BARBERO',
  'PROFESIONAL',
  'MESERO',
  'COCINERO',
];

const cop = (n) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

function Kpi({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`rounded-xl p-2 ${accent}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="truncate text-xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export default function CompanyDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCompanyDetail(Number(id));
      setData(res?.data || null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const [userModal, setUserModal] = useState(null); // null | {} (nuevo) | user
  const [payOpen, setPayOpen] = useState(false); // modal de registrar pago

  const c = data?.company;
  const b = data?.billing;
  const isActive = c?.status === 'ACTIVO';

  // Registra el pago (con sus datos) y refresca. El modal muestra errores
  // propios; aquí solo avisamos el éxito y cerramos.
  const submitPayment = async (payload) => {
    await renewCompany(Number(id), payload);
    await fetchData();
    setPayOpen(false);
    flash('success', `Pago registrado: +${payload.months} mes(es).`);
  };

  const doToggle = async () => {
    const next = isActive ? 'INACTIVO' : 'ACTIVO';
    if (!confirm(`¿${isActive ? 'Suspender' : 'Reactivar'} a ${c?.name}?`)) return;
    setBusy('toggle');
    try {
      await setCompanyStatus(Number(id), next);
      await fetchData();
      flash('success', isActive ? 'Empresa suspendida.' : 'Empresa reactivada.');
    } catch (e) {
      flash('error', e?.message || 'No se pudo cambiar el estado.');
    } finally {
      setBusy('');
    }
  };

  const doImpersonate = async () => {
    setBusy('imp');
    try {
      await enterAsCompany(Number(id));
      window.location.href = '/dashboard';
    } catch (e) {
      flash('error', e?.message || 'No se pudo entrar como la empresa.');
      setBusy('');
    }
  };

  const daysBadge = () => {
    if (b?.daysLeft === null || b?.daysLeft === undefined)
      return <span className="text-gray-400">Sin fecha de pago</span>;
    if (b.overdue)
      return (
        <span className="font-semibold text-red-600">
          Vencida hace {Math.abs(b.daysLeft)} días
        </span>
      );
    return (
      <span
        className={`font-semibold ${
          b.daysLeft <= 7 ? 'text-amber-600' : 'text-emerald-600'
        }`}
      >
        {b.daysLeft} días restantes
      </span>
    );
  };

  return (
    <RoleGuard allowedRoles={['SUPER_PLATFORM_ADMIN']}>
      <div className="relative w-full p-4">
        <LoadingOverlay show={loading} text="Cargando empresa..." />

        <Link
          href="/platform/companies"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeftIcon className="h-4 w-4" /> Empresas
        </Link>

        {msg && (
          <div
            className={`mb-4 rounded-lg px-4 py-2 text-sm ${
              msg.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {msg.text}
          </div>
        )}

        {c && (
          <>
            {/* Encabezado */}
            <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  {c.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.logo}
                      alt={c.name}
                      className="h-14 w-14 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-50 text-xl font-bold text-orange-500">
                      {c.name?.[0] || '?'}
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                      {c.name}
                    </h1>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 font-medium text-gray-600">
                        {c.type}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 font-medium ${
                          isActive
                            ? 'bg-green-50 text-green-600'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {c.status}
                      </span>
                      <span className="rounded-full bg-orange-50 px-2.5 py-0.5 font-medium text-orange-600">
                        Plan {c.plan || 'sin definir'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones rápidas */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setPayOpen(true)}
                  >
                    <ArrowPathIcon className="mr-1 h-4 w-4" /> Registrar pago
                  </Button>
                  {isActive && (
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={busy === 'imp'}
                      onClick={doImpersonate}
                    >
                      <ArrowRightEndOnRectangleIcon className="mr-1 h-4 w-4" />
                      Entrar como
                    </Button>
                  )}
                  <Button
                    variant={isActive ? 'danger' : 'success'}
                    size="sm"
                    loading={busy === 'toggle'}
                    onClick={doToggle}
                  >
                    <PowerIcon className="mr-1 h-4 w-4" />
                    {isActive ? 'Suspender' : 'Reactivar'}
                  </Button>
                  <Link href={`/platform/companies/edit/${id}`}>
                    <Button variant="secondary" size="sm">
                      <PencilSquareIcon className="mr-1 h-4 w-4" /> Editar
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-gray-100 pt-4 text-sm text-gray-600">
                {(c.startDate || c.createdAt) && (
                  <span>
                    Inicio:{' '}
                    <b>{formatDateOnly(c.startDate || c.createdAt)}</b>
                  </span>
                )}
                {c.billingMode === 'paquete' ? (
                  <span>
                    Pago hasta:{' '}
                    <b>{b?.paidUntil ? formatDateOnly(b.paidUntil) : '—'}</b>{' '}
                    ({daysBadge()})
                  </span>
                ) : (
                  <>
                    <span>
                      Cobro:{' '}
                      <b>
                        Mensual{c.paymentDay ? ` · día ${c.paymentDay}` : ''}
                      </b>
                    </span>
                    <span>Estado: {daysBadge()}</span>
                  </>
                )}
                {c.monthlyPrice != null && (
                  <span>
                    Precio/mes: <b>{cop(c.monthlyPrice)}</b>
                  </span>
                )}
                {c.manager && <span>Responsable: {c.manager}</span>}
                {c.phone && <span>Tel: {c.phone}</span>}
              </div>
            </div>

            {/* KPIs */}
            <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Kpi
                icon={BanknotesIcon}
                label="Ventas del mes"
                value={cop(data.salesMonth.total)}
                sub={`${data.salesMonth.count} ventas`}
                accent="bg-emerald-50 text-emerald-600"
              />
              <Kpi
                icon={UsersIcon}
                label="Usuarios"
                value={data.counts.users}
                accent="bg-orange-50 text-orange-600"
              />
              <Kpi
                icon={MapPinIcon}
                label="Sedes"
                value={data.counts.locals}
                accent="bg-teal-50 text-teal-600"
              />
              <Kpi
                icon={BuildingStorefrontIcon}
                label="Tienda online"
                value={c.websiteEnabled ? 'Activa' : 'No'}
                sub={c.domain || undefined}
                accent="bg-indigo-50 text-indigo-600"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {/* Usuarios */}
              <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-800">
                    Usuarios ({data.users.length})
                  </h2>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setUserModal({})}
                  >
                    <PlusIcon className="mr-1 h-4 w-4" /> Agregar usuario
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wide text-gray-500">
                      <tr className="border-b border-gray-100">
                        <th className="py-2 pr-4">Nombre</th>
                        <th className="py-2 pr-4">Correo</th>
                        <th className="py-2 pr-4">Rol</th>
                        <th className="py-2 pr-4">Estado</th>
                        <th className="py-2 pr-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.users.map((u) => (
                        <tr key={u.id} className="text-gray-700">
                          <td className="py-2 pr-4 font-medium">{u.name}</td>
                          <td className="py-2 pr-4">{u.email}</td>
                          <td className="py-2 pr-4">
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2 pr-4">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs ${
                                u.status === 'ACTIVO'
                                  ? 'bg-green-50 text-green-600'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                          <td className="py-2 pr-4">
                            <div className="flex justify-center">
                              <TableActionButton
                                icon={PencilSquareIcon}
                                label="Editar usuario"
                                variant="edit"
                                onClick={() => setUserModal(u)}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Estado de funciones/módulos */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold text-gray-800">
                  Funciones
                </h2>
                <ul className="space-y-2 text-sm text-gray-600">
                  <FeatureRow label="Consignaciones (banco)" on={c.bankNotifyEnabled} />
                  <FeatureRow
                    label="Facturación electrónica"
                    on={c.electronicInvoicingEnabled}
                  />
                  <FeatureRow label="Pagos en línea (Wompi)" on={c.wompiEnabled} />
                  <FeatureRow label="Tienda online" on={c.websiteEnabled} />
                  <FeatureRow label="Empresa de pruebas (sandbox)" on={c.isTestCompany} />
                </ul>
                <div className="mt-4 border-t border-gray-100 pt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Módulos
                  </p>
                  {c.enabledModules?.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {c.enabledModules.map((m) => (
                        <span
                          key={m}
                          className="rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-600"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">
                      Automático (según tipo de negocio y plan).
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Historial de pagos de suscripción */}
            <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-gray-800">
                  Historial de pagos ({data.paymentsSummary?.count || 0})
                </h2>
                {data.paymentsSummary?.totalPaid > 0 && (
                  <span className="text-sm text-gray-500">
                    Total cobrado:{' '}
                    <b className="text-gray-800">
                      {cop(data.paymentsSummary.totalPaid)}
                    </b>
                    {data.paymentsSummary.lastPaidAt && (
                      <>
                        {' '}· Último:{' '}
                        {formatDateOnly(data.paymentsSummary.lastPaidAt)}
                      </>
                    )}
                  </span>
                )}
              </div>
              {data.payments?.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wide text-gray-500">
                      <tr className="border-b border-gray-100">
                        <th className="py-2 pr-4">Fecha</th>
                        <th className="py-2 pr-4">Meses</th>
                        <th className="py-2 pr-4">Período cubierto</th>
                        <th className="py-2 pr-4 text-right">Precio/mes</th>
                        <th className="py-2 pr-4 text-right">Descuento</th>
                        <th className="py-2 pr-4 text-right">Cobrado</th>
                        <th className="py-2 pr-4">Medio</th>
                        <th className="py-2 pr-4">Nota</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.payments.map((p) => {
                        const desc =
                          p.discountType === 'PERCENT'
                            ? `${p.discountValue}%`
                            : p.discountType === 'AMOUNT'
                              ? cop(p.discountValue)
                              : '—';
                        return (
                          <tr key={p.id} className="text-gray-700">
                            <td className="py-2 pr-4 font-medium">
                              {formatDateOnly(p.paidAt)}
                            </td>
                            <td className="py-2 pr-4">{p.months}</td>
                            <td className="py-2 pr-4 text-gray-500">
                              {p.periodFrom
                                ? `${formatDateOnly(p.periodFrom)} → `
                                : '→ '}
                              {formatDateOnly(p.periodTo)}
                            </td>
                            <td className="py-2 pr-4 text-right tabular-nums">
                              {cop(p.unitPrice)}
                            </td>
                            <td className="py-2 pr-4 text-right tabular-nums">
                              {desc}
                            </td>
                            <td className="py-2 pr-4 text-right font-semibold tabular-nums text-gray-900">
                              {cop(p.amount)}
                            </td>
                            <td className="py-2 pr-4">
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                                {p.method === 'EFECTIVO'
                                  ? 'Efectivo'
                                  : 'Transferencia'}
                              </span>
                            </td>
                            <td className="py-2 pr-4 text-gray-500">
                              {p.note || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-gray-400">
                  Aún no hay pagos registrados. Usa{' '}
                  <b className="text-gray-600">Registrar pago</b> arriba.
                </p>
              )}
            </div>
          </>
        )}

        {payOpen && c && (
          <PaymentModal
            company={c}
            onClose={() => setPayOpen(false)}
            onSubmit={submitPayment}
          />
        )}

        {userModal && c && (
          <UserEditor
            initial={userModal.id ? userModal : null}
            companyId={Number(id)}
            locals={data.locals || []}
            onClose={() => setUserModal(null)}
            onSaved={() => {
              setUserModal(null);
              fetchData();
            }}
          />
        )}
      </div>
    </RoleGuard>
  );
}

const editorInput =
  'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20';

function UserEditor({ initial, companyId, locals, onClose, onSaved }) {
  const isEdit = !!initial;
  const [f, setF] = useState({
    name: initial?.name || '',
    email: initial?.email || '',
    password: '',
    role: initial?.role || 'ASESOR',
    status: initial?.status || 'ACTIVO',
    localId: initial?.localId ? String(initial.localId) : '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setErr('');
    if (!isEdit) {
      if (!f.name.trim() || !f.email.trim() || f.password.length < 6) {
        setErr('Nombre, correo y contraseña (mínimo 6) son obligatorios.');
        return;
      }
    }
    setSaving(true);
    try {
      const localId = f.localId ? Number(f.localId) : null;
      if (isEdit) {
        await platformUpdateUser(initial.id, {
          name: f.name.trim(),
          role: f.role,
          status: f.status,
          localId,
        });
        if (f.password.trim()) {
          await platformResetUserPassword(initial.id, f.password.trim());
        }
      } else {
        await platformCreateUser(companyId, {
          name: f.name.trim(),
          email: f.email.trim(),
          password: f.password,
          role: f.role,
          localId,
        });
      }
      onSaved();
    } catch (e) {
      setErr(e?.message || 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-800">
          {isEdit ? `Editar usuario` : 'Nuevo usuario'}
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Nombre
            </label>
            <input
              className={editorInput}
              value={f.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Correo
            </label>
            <input
              className={editorInput}
              value={f.email}
              onChange={(e) => set('email', e.target.value)}
              disabled={isEdit}
              placeholder="correo@negocio.com"
            />
            {isEdit && (
              <p className="mt-1 text-xs text-gray-400">
                El correo no se cambia.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Rol
              </label>
              <select
                className={editorInput}
                value={f.role}
                onChange={(e) => set('role', e.target.value)}
              >
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Sede
              </label>
              <select
                className={editorInput}
                value={f.localId}
                onChange={(e) => set('localId', e.target.value)}
              >
                <option value="">Sin sede</option>
                {locals.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isEdit && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Estado
              </label>
              <select
                className={editorInput}
                value={f.status}
                onChange={(e) => set('status', e.target.value)}
              >
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              {isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña'}
            </label>
            <input
              type="text"
              className={editorInput}
              value={f.password}
              onChange={(e) => set('password', e.target.value)}
              placeholder={isEdit ? 'Déjalo vacío para no cambiarla' : 'Mínimo 6 caracteres'}
              autoComplete="off"
            />
          </div>
        </div>

        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" loading={saving} onClick={save}>
            {isEdit ? 'Guardar' : 'Crear usuario'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({ company, onClose, onSubmit }) {
  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();
  const todayISO = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const [f, setF] = useState({
    months: 1,
    unitPrice: company?.monthlyPrice ? String(company.monthlyPrice) : '',
    discountType: '', // '' (sin desc.) | 'AMOUNT' | 'PERCENT'
    discountValue: '',
    method: 'TRANSFERENCIA',
    note: '',
    paidAt: todayISO,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const int = (v) => Number(String(v ?? '').replace(/[^\d]/g, '')) || 0;
  const months = Math.max(0, int(f.months));
  const unitPrice = int(f.unitPrice);
  const gross = unitPrice * months;
  const dv = int(f.discountValue);
  const discountAmount =
    f.discountType === 'PERCENT'
      ? Math.round((gross * dv) / 100)
      : f.discountType === 'AMOUNT'
        ? dv
        : 0;
  const amountFinal = Math.max(0, gross - discountAmount);

  const save = async () => {
    setErr('');
    if (months < 1) {
      setErr('Indica cuántos meses cubre el pago (mínimo 1).');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        months,
        unitPrice,
        discountType: f.discountType || null,
        discountValue: dv,
        method: f.method,
        note: f.note.trim(),
        paidAt: f.paidAt,
      });
    } catch (e) {
      setErr(e?.message || 'No se pudo registrar el pago.');
      setSaving(false);
    }
  };

  const inp =
    'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20';
  const lbl = 'mb-1 block text-xs font-semibold text-gray-600';

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-800">Registrar pago</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          {company?.name} · se extiende la fecha de pago anclada al día de cobro.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={lbl}>Meses que cubre</label>
            <input
              type="number"
              min={1}
              className={inp}
              value={f.months}
              onChange={(e) => set('months', e.target.value)}
            />
          </div>
          <div>
            <label className={lbl}>Fecha del pago</label>
            <input
              type="date"
              className={inp}
              value={f.paidAt}
              onChange={(e) => set('paidAt', e.target.value)}
            />
          </div>
          <div>
            <label className={lbl}>Precio por mes (COP)</label>
            <input
              type="number"
              min={0}
              className={inp}
              value={f.unitPrice}
              onChange={(e) => set('unitPrice', e.target.value)}
              placeholder="Ej: 150000"
            />
          </div>
          <div>
            <label className={lbl}>Medio de pago</label>
            <select
              className={inp}
              value={f.method}
              onChange={(e) => set('method', e.target.value)}
            >
              <option value="TRANSFERENCIA">Transferencia / Bancolombia</option>
              <option value="EFECTIVO">Efectivo</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Descuento</label>
            <select
              className={inp}
              value={f.discountType}
              onChange={(e) => set('discountType', e.target.value)}
            >
              <option value="">Sin descuento</option>
              <option value="AMOUNT">Monto ($)</option>
              <option value="PERCENT">Porcentaje (%)</option>
            </select>
          </div>
          <div>
            <label className={lbl}>
              Valor del descuento {f.discountType === 'PERCENT' ? '(%)' : '($)'}
            </label>
            <input
              type="number"
              min={0}
              className={inp}
              value={f.discountValue}
              onChange={(e) => set('discountValue', e.target.value)}
              disabled={!f.discountType}
              placeholder={f.discountType ? '0' : '—'}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Nota (opcional)</label>
            <input
              className={inp}
              value={f.note}
              onChange={(e) => set('note', e.target.value)}
              placeholder="Ej: pago 4 meses con descuento acordado"
            />
          </div>
        </div>

        {/* Resumen */}
        <div className="mt-4 rounded-xl bg-gray-50 p-3 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>
              Bruto ({months} mes{months === 1 ? '' : 'es'} × {cop(unitPrice)})
            </span>
            <span className="tabular-nums">{cop(gross)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Descuento</span>
              <span className="tabular-nums">− {cop(discountAmount)}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t border-gray-200 pt-1 font-semibold text-gray-900">
            <span>Total a cobrar</span>
            <span className="tabular-nums">{cop(amountFinal)}</span>
          </div>
        </div>

        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" loading={saving} onClick={save}>
            Registrar pago
          </Button>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ label, on }) {
  return (
    <li className="flex items-center justify-between">
      <span>{label}</span>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          on ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
        }`}
      >
        {on ? 'Sí' : 'No'}
      </span>
    </li>
  );
}
