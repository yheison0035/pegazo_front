'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BanknotesIcon,
  ShoppingCartIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  PlusIcon,
  CubeIcon,
  UsersIcon,
  CreditCardIcon,
  ClockIcon,
  ArrowPathIcon,
  GiftIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import { useAuth } from '@/context/authContext';
import useTerms from '@/hooks/useTerms';
import Button from '@/components/ui/Button';
import { getHomeSummary } from '@/lib/api/routes/statistics';
import { getLowStock, getExpiring } from '@/lib/api/routes/inventory';
import { getReceivables } from '@/lib/api/routes/sales';
import { getAppointmentsAgenda } from '@/lib/api/routes/appointments';
import { isServicesBusiness } from '@/lib/appointmentsAccess';
import { getProductFields } from '@/config/verticalProfiles';
import ReactivateCustomersModal from '@/components/appointments/ReactivateCustomersModal';
import { formatCOP } from '@/lib/api/utils/utils';

function firstName(name) {
  return String(name || '').trim().split(/\s+/)[0] || '';
}

// Fecha "solo día" (ISO a medianoche UTC) -> DD/MM, con Hoy/Mañana.
function apptDay(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const key = `${d.getUTCFullYear()}-${mm}-${dd}`;
  const now = new Date();
  const t0 = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const tom = new Date(now.getTime() + 86400000);
  const t1 = `${tom.getFullYear()}-${String(tom.getMonth() + 1).padStart(2, '0')}-${String(tom.getDate()).padStart(2, '0')}`;
  if (key === t0) return 'Hoy';
  if (key === t1) return 'Mañana';
  return `${dd}/${mm}`;
}

// Mini gráfica de ventas de la semana (usa el color del tema).
function WeekChart({ data }) {
  const rows = (data || []).map((x) => ({
    label: x.date.slice(8) + '/' + x.date.slice(5, 7),
    total: x.total,
  }));
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 5, right: 6, left: 6, bottom: 0 }}>
          <defs>
            <linearGradient id="wk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-orange-500)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-orange-500)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--color-gray-400)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(v) => formatCOP(v)}
            labelStyle={{ color: 'var(--color-gray-500)' }}
            contentStyle={{
              background: 'var(--color-white)',
              border: '1px solid var(--color-gray-200)',
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="var(--color-orange-500)"
            strokeWidth={2}
            fill="url(#wk)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Tarjeta de alerta clicable (cartera vencida / por reactivar).
function AlertCard({ href, onClick, icon: Icon, tone, title, value, sub }) {
  const tones = {
    red: 'border-red-100 bg-red-50/60 text-red-600',
    amber: 'border-amber-100 bg-amber-50/60 text-amber-600',
  };
  const body = (
    <div className={`rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${tones[tone] || 'border-gray-100 bg-white'}`}>
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <p className="mt-1 text-xl font-bold">{value}</p>
      <p className="text-xs opacity-80">{sub}</p>
    </div>
  );
  if (onClick)
    return (
      <button type="button" onClick={onClick} className="w-full text-left">
        {body}
      </button>
    );
  return href ? <Link href={href}>{body}</Link> : body;
}

// Tarjeta de lista corta (próximas citas / cumpleaños).
function ListCard({ title, icon, items, href }) {
  const inner = (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
        {icon}
        {title}
      </div>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li key={it.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate text-gray-800">{it.main}</span>
            <span className="flex-none text-xs text-gray-400">{it.sub}</span>
          </li>
        ))}
      </ul>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function MiniStat({ label, value, accent = 'text-gray-900', href }) {
  const body = (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-1 text-xl font-bold ${accent}`}>{value}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function Kpi({ icon: Icon, label, value, accent = 'text-gray-900', href }) {
  const inner = (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function DashboardHome() {
  const auth = useAuth();
  const usuario = auth?.usuario;
  const t = useTerms();
  const isServices = isServicesBusiness(usuario);
  // Datos financieros (utilidad, IVA) solo para dueño/administrador.
  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(usuario?.role);

  const [home, setHome] = useState(null);
  const [showReactivate, setShowReactivate] = useState(false);
  const [todayAppts, setTodayAppts] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [receivable, setReceivable] = useState(0);
  const [expiring, setExpiring] = useState([]);

  // Verticales que manejan vencimiento (droguería / perecederos).
  const hasExpiry = !!getProductFields(usuario?.company?.type).expiry;

  useEffect(() => {
    if (!usuario) return;
    getHomeSummary()
      .then((r) => setHome(r?.data || null))
      .catch(() => setHome(null));
    getLowStock()
      .then((r) => setLowStock(r?.data || []))
      .catch(() => setLowStock([]));
    getReceivables()
      .then((r) => setReceivable(r?.data?.totalSaldo || 0))
      .catch(() => setReceivable(0));
    if (isServices) {
      getAppointmentsAgenda()
        .then((r) => setTodayAppts(r?.data?.today || []))
        .catch(() => setTodayAppts([]));
    }
    if (hasExpiry) {
      getExpiring()
        .then((r) => setExpiring(r?.data || []))
        .catch(() => setExpiring([]));
    }
  }, [usuario, isServices, hasExpiry]);

  const setup = home?.setup;
  const catalogStep = isServices
    ? {
        done: (setup?.services ?? 0) > 0,
        label: `Agrega tu primer ${t.service.toLowerCase()}`,
        href: '/dashboard/services/new',
      }
    : {
        done: (setup?.products ?? 0) > 0,
        label: `Agrega tu primer ${t.product.toLowerCase()}`,
        href: '/dashboard/inventory/new',
      };

  const steps = setup
    ? [
        {
          done: setup.locals > 0,
          label: 'Crea tu punto de venta',
          href: '/dashboard/locals/new',
        },
        catalogStep,
        {
          done: setup.sales > 0,
          label: `Registra tu primera ${t.sale.toLowerCase()}`,
          href: '/dashboard/sales',
        },
      ]
    : [];
  const setupIncomplete = steps.some((s) => !s.done);

  return (
    <div className="mx-auto w-full max-w-5xl p-4">
      {/* Saludo */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">
          Hola{usuario?.name ? `, ${firstName(usuario.name)}` : ''}
        </h1>
        <p className="text-sm text-gray-500">
          {usuario?.company?.name || 'Tu negocio'} · Este es tu panel de hoy.
        </p>
      </div>

      {/* Checklist de primeros pasos */}
      {setupIncomplete && (
        <div className="mb-5 rounded-2xl border border-orange-100 bg-orange-50/60 p-5">
          <h2 className="text-base font-bold text-gray-800">
            Primeros pasos
          </h2>
          <p className="text-sm text-gray-500">
            Completa esto para empezar a trabajar con Pegazo.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {steps.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 transition ${
                  s.done
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-gray-200 bg-white hover:border-orange-300'
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
                  {s.done ? (
                    <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-300" />
                  )}
                  <span className={s.done ? 'text-gray-400 line-through' : ''}>
                    {s.label}
                  </span>
                </span>
                {!s.done && (
                  <ArrowRightIcon className="h-4 w-4 text-orange-500" />
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* KPIs de hoy */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          icon={BanknotesIcon}
          label={`${t.salePlural} hoy`}
          value={home ? formatCOP(home.today.total) : '—'}
          accent="text-emerald-600"
          href="/dashboard/delivered_sales"
        />
        <Kpi
          icon={ShoppingCartIcon}
          label="Nº de hoy"
          value={home ? home.today.count : '—'}
          href="/dashboard/delivered_sales"
        />
        {isServices && (
          <Kpi
            icon={CalendarDaysIcon}
            label="Citas hoy"
            value={todayAppts ? todayAppts.length : '—'}
            href="/dashboard/appointments"
          />
        )}
        {lowStock.length > 0 && (
          <Kpi
            icon={ExclamationTriangleIcon}
            label="Por agotarse"
            value={lowStock.length}
            accent="text-red-600"
            href="/dashboard/inventory"
          />
        )}
        {receivable > 0 && (
          <Kpi
            icon={CreditCardIcon}
            label="Por cobrar (fiado)"
            value={formatCOP(receivable)}
            accent="text-orange-600"
            href="/dashboard/cartera"
          />
        )}
        {hasExpiry && expiring.length > 0 && (
          <Kpi
            icon={ClockIcon}
            label="Por vencer"
            value={expiring.length}
            accent="text-amber-600"
            href="/dashboard/inventory"
          />
        )}
      </div>

      {/* Ventas de la semana + panel de alertas/agenda */}
      {home && (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:col-span-2">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-700">
                {t.salePlural} de la semana
              </h2>
              <span className="text-xs text-gray-400">Últimos 7 días</span>
            </div>
            <WeekChart data={home.weekSales} />
          </div>

          <div className="space-y-3">
            {home.overdue?.count > 0 && (
              <AlertCard
                href="/dashboard/cartera"
                icon={ExclamationTriangleIcon}
                tone="red"
                title="Cartera vencida"
                value={formatCOP(home.overdue.total)}
                sub={`${home.overdue.count} ${
                  home.overdue.count === 1 ? 'cuenta' : 'cuentas'
                } en mora`}
              />
            )}
            {home.winbackCount > 0 && (
              <AlertCard
                onClick={() => setShowReactivate(true)}
                icon={ArrowPathIcon}
                tone="amber"
                title="Por reactivar"
                value={home.winbackCount}
                sub={`${t.customerPlural} sin volver hace 20+ días`}
              />
            )}
            {isServices && home.nextAppointments?.length > 0 && (
              <ListCard
                title="Próximas citas"
                href="/dashboard/appointments"
                items={home.nextAppointments.map((a) => ({
                  id: a.id,
                  main: a.customer?.name || '—',
                  sub: `${apptDay(a.date)} · ${a.startTime || ''}`,
                }))}
              />
            )}
            {home.birthdays?.length > 0 && (
              <ListCard
                title="Cumpleaños esta semana"
                icon={<GiftIcon className="h-4 w-4 text-orange-500" />}
                items={home.birthdays.map((b) => ({
                  id: b.id,
                  main: b.name,
                  sub: b.date,
                }))}
              />
            )}
          </div>
        </div>
      )}

      {/* Resumen del mes (solo dueño/admin) */}
      {isAdmin && home?.month && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat
            label="Ventas del mes"
            value={formatCOP(home.month.sales)}
            accent="text-emerald-600"
          />
          <MiniStat
            label="Gastos del mes"
            value={formatCOP(home.month.expenses)}
            accent="text-red-500"
          />
          <MiniStat
            label="Utilidad del mes"
            value={formatCOP(home.month.profit)}
            accent={home.month.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}
          />
          {home.iva && (
            <MiniStat
              label="IVA generado (mes)"
              value={formatCOP(home.iva.generado)}
              accent="text-orange-600"
              href="/dashboard/impuestos"
            />
          )}
        </div>
      )}

      {/* Accesos rápidos */}
      <div className="mt-6">
        <h2 className="mb-2 text-sm font-bold text-gray-700">Accesos rápidos</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" icon={PlusIcon} href="/dashboard/sales">
            Nueva {t.sale.toLowerCase()}
          </Button>
          {isServices && (
            <Button
              variant="add"
              icon={CalendarDaysIcon}
              href="/dashboard/appointments/new"
            >
              Nueva cita
            </Button>
          )}
          <Button variant="secondary" icon={CubeIcon} href="/dashboard/inventory">
            {t.productPlural}
          </Button>
          <Button
            variant="secondary"
            icon={UsersIcon}
            href="/dashboard/customers"
          >
            {t.customerPlural}
          </Button>
        </div>
      </div>

      {showReactivate && (
        <ReactivateCustomersModal onClose={() => setShowReactivate(false)} />
      )}
    </div>
  );
}
