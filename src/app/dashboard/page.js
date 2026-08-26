'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircleIcon,
  ArrowRightIcon,
  PlusIcon,
  CalendarDaysIcon,
  CubeIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/authContext';
import useTerms from '@/hooks/useTerms';
import Button from '@/components/ui/Button';
import { getHomeSummary, getMyPerformance } from '@/lib/api/routes/statistics';
import { getLowStock } from '@/lib/api/routes/inventory';
import { getReceivables } from '@/lib/api/routes/sales';
import { getAppointmentsAgenda } from '@/lib/api/routes/appointments';
import { getBankDeposits } from '@/lib/api/routes/bank';
import { isServicesBusiness } from '@/lib/appointmentsAccess';
import ReactivateCustomersModal from '@/components/appointments/ReactivateCustomersModal';
import LowStockModal from '@/components/dashboard/inventory/LowStockModal';
import MyWeeklyHistoryModal from '@/components/dashboard/home/MyWeeklyHistoryModal';
import MyDetailModal from '@/components/dashboard/home/MyDetailModal';
import TodayAppointmentsModal from '@/components/dashboard/home/TodayAppointmentsModal';
import WidgetBoard from '@/components/dashboard/home/WidgetBoard';

// Roles que solo ven SU información (empleado de servicio, no dueño/caja).
const SELF_ONLY_ROLES = ['BARBERO', 'PROFESIONAL'];

function firstName(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)[0] || '';
}

export default function DashboardHome() {
  const auth = useAuth();
  const usuario = auth?.usuario;
  const t = useTerms();
  const isServices = isServicesBusiness(usuario);
  // Datos financieros (utilidad, IVA) solo para dueño/administrador.
  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(usuario?.role);
  // El barbero/profesional solo ve SU información (nada del negocio).
  const isBarber = SELF_ONLY_ROLES.includes(usuario?.role);
  // Consignaciones: NUNCA para el barbero (es del negocio).
  const showBank =
    !isBarber && !!usuario?.company?.bankNotifyEnabled && !!usuario?.role;

  const [home, setHome] = useState(null);
  const [myPerf, setMyPerf] = useState(null);
  const [todayAppts, setTodayAppts] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [receivable, setReceivable] = useState(0);
  const [bankDeposits, setBankDeposits] = useState([]);
  const [showReactivate, setShowReactivate] = useState(false);
  const [showLowStock, setShowLowStock] = useState(false);
  const [showWeekly, setShowWeekly] = useState(false);
  const [detailPeriod, setDetailPeriod] = useState(null); // 'today'|'week'|'month'
  const [showTodayAppts, setShowTodayAppts] = useState(false);

  useEffect(() => {
    if (!usuario) return;

    // Barbero: SOLO su rendimiento + sus citas de hoy. Nada del negocio.
    if (isBarber) {
      getMyPerformance()
        .then((r) => setMyPerf(r?.data || null))
        .catch(() => setMyPerf(null));
      getHomeSummary()
        .then((r) => setHome(r?.data || null))
        .catch(() => setHome(null));
      getAppointmentsAgenda()
        .then((r) => setTodayAppts(r?.data?.today || []))
        .catch(() => setTodayAppts([]));
      return;
    }

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
    if (showBank) {
      const loadBank = () =>
        getBankDeposits({ limit: 6 })
          .then((r) => setBankDeposits(r?.data || []))
          .catch(() => {});
      loadBank();
      const bt = setInterval(loadBank, 10000);
      return () => clearInterval(bt);
    }
  }, [usuario, isServices, showBank, isBarber]);

  // ---- Checklist de primeros pasos ----
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

  // Datos y acciones que consumen los widgets.
  const teamBirthdays = isBarber
    ? myPerf?.teamBirthdays
    : home?.teamBirthdays;
  const data = useMemo(
    () => ({
      home,
      myPerf,
      teamBirthdays,
      todayAppts,
      lowStock,
      receivable,
      bankDeposits,
      isServices,
      isAdmin,
      isBarber,
      showBank,
      t,
      usuario,
    }),
    [
      home,
      myPerf,
      teamBirthdays,
      todayAppts,
      lowStock,
      receivable,
      bankDeposits,
      isServices,
      isAdmin,
      isBarber,
      showBank,
      t,
      usuario,
    ],
  );
  const actions = useMemo(
    () => ({
      openReactivate: () => setShowReactivate(true),
      openLowStock: () => setShowLowStock(true),
      openWeeklyHistory: () => setShowWeekly(true),
      openDetail: (period) => setDetailPeriod(period || 'today'),
      openTodayAppts: () => setShowTodayAppts(true),
    }),
    [],
  );

  return (
    <div className="mx-auto w-full max-w-5xl p-4">
      {/* Saludo */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">
          Hola{usuario?.name ? `, ${firstName(usuario.name)}` : ''}
        </h1>
        <p className="text-sm text-gray-500">
          {usuario?.company?.name || 'Tu negocio'} · Este es tu panel.
        </p>
      </div>

      {/* Checklist de primeros pasos (no aplica al barbero) */}
      {!isBarber && setupIncomplete && (
        <div className="mb-5 rounded-2xl border border-orange-100 bg-orange-50/60 p-5">
          <h2 className="text-base font-bold text-gray-800">Primeros pasos</h2>
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

      {/* Panel de widgets personalizable */}
      <WidgetBoard data={data} actions={actions} />

      {/* Accesos rápidos (el barbero no crea nada: solo visualiza) */}
      {isBarber ? (
        <div className="mt-6">
          <Button
            variant="secondary"
            icon={CalendarDaysIcon}
            href="/dashboard/appointments"
          >
            Mis citas
          </Button>
        </div>
      ) : (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-bold text-gray-700">
            Accesos rápidos
          </h2>
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
            <Button
              variant="secondary"
              icon={CubeIcon}
              href="/dashboard/inventory"
            >
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
      )}

      {showWeekly && (
        <MyWeeklyHistoryModal onClose={() => setShowWeekly(false)} />
      )}
      {detailPeriod && (
        <MyDetailModal
          period={detailPeriod}
          onClose={() => setDetailPeriod(null)}
        />
      )}
      {showTodayAppts && (
        <TodayAppointmentsModal
          initialRange="today"
          onClose={() => setShowTodayAppts(false)}
        />
      )}
      {showReactivate && (
        <ReactivateCustomersModal onClose={() => setShowReactivate(false)} />
      )}
      {showLowStock && (
        <LowStockModal
          items={lowStock}
          onClose={() => {
            setShowLowStock(false);
            getLowStock()
              .then((r) => setLowStock(r?.data || []))
              .catch(() => {});
          }}
        />
      )}
    </div>
  );
}
