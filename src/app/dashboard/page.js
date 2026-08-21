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
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/authContext';
import useTerms from '@/hooks/useTerms';
import Button from '@/components/ui/Button';
import { getHomeSummary } from '@/lib/api/routes/statistics';
import { getLowStock } from '@/lib/api/routes/inventory';
import { getAppointmentsAgenda } from '@/lib/api/routes/appointments';
import { isServicesBusiness } from '@/lib/appointmentsAccess';
import { formatCOP } from '@/lib/api/utils/utils';

function firstName(name) {
  return String(name || '').trim().split(/\s+/)[0] || '';
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

  const [home, setHome] = useState(null);
  const [todayAppts, setTodayAppts] = useState(null);
  const [lowStock, setLowStock] = useState([]);

  useEffect(() => {
    if (!usuario) return;
    getHomeSummary()
      .then((r) => setHome(r?.data || null))
      .catch(() => setHome(null));
    getLowStock()
      .then((r) => setLowStock(r?.data || []))
      .catch(() => setLowStock([]));
    if (isServices) {
      getAppointmentsAgenda()
        .then((r) => setTodayAppts(r?.data?.today || []))
        .catch(() => setTodayAppts([]));
    }
  }, [usuario, isServices]);

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
      </div>

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
    </div>
  );
}
