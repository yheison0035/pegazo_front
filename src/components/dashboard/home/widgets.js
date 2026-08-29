'use client';

import Link from 'next/link';
import {
  BanknotesIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  GiftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { formatCOP, formatDateTime } from '@/lib/api/utils/utils';
import SalesTrendChart from './SalesTrendChart';
import CalculatorWidget from './CalculatorWidget';

// Medios de pago: etiqueta legible y un color para el punto.
const PAY_LABEL = {
  EFECTIVO: 'Efectivo',
  BANCOLOMBIA: 'Bancolombia',
  TRANSFERENCIA: 'Transferencia',
  DATAFONO: 'Datáfono',
  ADDI: 'Addi',
  CREDITO: 'Crédito (fiado)',
};
const PAY_DOT = {
  EFECTIVO: 'bg-emerald-500',
  BANCOLOMBIA: 'bg-yellow-500',
  TRANSFERENCIA: 'bg-sky-500',
  DATAFONO: 'bg-violet-500',
  ADDI: 'bg-pink-500',
  CREDITO: 'bg-orange-500',
};

// Tarjeta base reutilizable.
function Card({ children, className = '' }) {
  return (
    <div
      className={`h-full rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
function Stat({ label, value, accent = 'text-gray-800' }) {
  return (
    <div className="min-w-0 rounded-xl bg-gray-50 px-3 py-2">
      <p
        className={`text-base font-bold leading-tight tabular-nums ${accent}`}
      >
        {value}
      </p>
      <p className="truncate text-[11px] font-medium text-gray-500">{label}</p>
    </div>
  );
}
// Fila de dinero adaptable: etiqueta a la izquierda (se recorta si no cabe) y
// valor a la derecha en una sola línea (nunca se sale del contenedor).
function MoneyRow({ label, value, accent = 'text-gray-800', strong = false }) {
  return (
    <li
      className={`flex items-center justify-between gap-2 ${
        strong ? 'border-t border-gray-100 pt-1.5' : ''
      }`}
    >
      <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-500">
        {label}
      </span>
      <span
        className={`flex-none whitespace-nowrap tabular-nums ${
          strong ? 'text-base font-bold' : 'text-sm font-semibold'
        } ${accent}`}
      >
        {value}
      </span>
    </li>
  );
}
function Label({ icon: Icon, children, accent = 'text-gray-400' }) {
  return (
    <p
      className={`mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${accent}`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </p>
  );
}
function NoRateNote() {
  return (
    <div className="mt-2 rounded-xl bg-amber-500/10 p-2.5 text-center text-xs text-amber-700">
      Aún no tienes tu porcentaje configurado. Pídele al administrador que lo
      ajuste para ver tu ganancia.
    </div>
  );
}
// Tarjeta que es un ATAJO: al tocarla abre su detalle (modal con onClick, o
// navega si se pasa href). Aplica a TODOS los roles, no solo al barbero.
const SHORTCUT_CLASS =
  'relative block h-full cursor-pointer rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md';
function HintChip({ hint }) {
  if (!hint) return null;
  return (
    <span className="absolute right-4 top-4 inline-flex items-center gap-0.5 text-xs font-medium text-orange-600">
      {hint} <ChevronRightIcon className="h-3.5 w-3.5" />
    </span>
  );
}
function ShortcutCard({ onClick, href, hint, children }) {
  if (href) {
    return (
      <Link href={href} className={SHORTCUT_CLASS}>
        <HintChip hint={hint} />
        {children}
      </Link>
    );
  }
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.();
      }}
      className={SHORTCUT_CLASS}
    >
      <HintChip hint={hint} />
      {children}
    </div>
  );
}

// Cada widget: id, nombre (catálogo), wide (ocupa toda la fila), applies(data)
// y Render({data, actions}). Todo se sincroniza con el tema vía tokens.
export const WIDGETS = [
  {
    id: 'hoy',
    name: 'Resumen de hoy',
    applies: () => true,
    Render: ({ data }) => {
      const { home } = data;
      const byMethod = home?.today?.byMethod || [];
      // Fecha de hoy en zona Colombia para llevar al listado ya filtrado.
      const todayCol = new Date().toLocaleDateString('en-CA', {
        timeZone: 'America/Bogota',
      });
      return (
        <ShortcutCard
          href={`/dashboard/delivered_sales?date=${todayCol}`}
          hint="Ver ventas de hoy"
        >
          <Label>Hoy</Label>
          <div className="grid grid-cols-2 gap-2">
            <Stat
              label={`${data.t.salePlural}`}
              value={home ? formatCOP(home.today.total) : '—'}
              accent="text-emerald-600"
            />
            <Stat label="Nº de hoy" value={home ? home.today.count : '—'} />
          </div>

          {/* Desglose por medio de pago (para no abrir el historial) */}
          {byMethod.length > 0 && (
            <div className="mt-3 border-t border-gray-100 pt-2">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Por medio de pago
              </p>
              <ul className="space-y-1">
                {byMethod.map((m) => (
                  <li
                    key={m.method}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="flex items-center gap-2 text-gray-600">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          PAY_DOT[m.method] || 'bg-gray-400'
                        }`}
                      />
                      {PAY_LABEL[m.method] || m.method}
                    </span>
                    <span className="font-semibold text-gray-800">
                      {formatCOP(m.total)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ShortcutCard>
      );
    },
  },
  {
    id: 'grafica',
    name: 'Gráfica de ventas',
    wide: true,
    applies: () => true,
    Render: ({ data }) => <SalesTrendChart title={data.t.salePlural} />,
  },
  {
    id: 'inventario',
    name: 'Inventario por agotarse',
    applies: () => true,
    Render: ({ data, actions }) => {
      const items = data.lowStock || [];
      const agotados = items.filter((i) => (i.stock || 0) <= 0).length;
      const porAgotarse = items.length - agotados;
      const inner = (
        <>
          <Label icon={ExclamationTriangleIcon} accent="text-gray-500">
            Inventario
          </Label>
          {items.length === 0 ? (
            <p className="py-3 text-center text-xs text-gray-400">
              Todo con stock suficiente. 🎉
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-red-500/10 px-3 py-2">
                <p className="text-xl font-bold text-red-600">{agotados}</p>
                <p className="text-[11px] font-medium text-red-700">
                  {data.t.productPlural} agotados
                </p>
              </div>
              <div className="rounded-xl bg-amber-500/10 px-3 py-2">
                <p className="text-xl font-bold text-amber-600">
                  {porAgotarse}
                </p>
                <p className="text-[11px] font-medium text-amber-700">
                  por agotarse
                </p>
              </div>
            </div>
          )}
        </>
      );
      return items.length > 0 ? (
        <ShortcutCard onClick={actions.openLowStock} hint="Ver detalle">
          {inner}
        </ShortcutCard>
      ) : (
        <Card>{inner}</Card>
      );
    },
  },
  {
    id: 'consignaciones',
    name: 'Consignaciones',
    applies: (data) => data.showBank,
    Render: ({ data }) => {
      const deposits = data.bankDeposits || [];
      return (
        <ShortcutCard href="/dashboard/bank" hint="Ver todas">
          <Label icon={BanknotesIcon} accent="text-emerald-600">
            Consignaciones
          </Label>
          {deposits.length === 0 ? (
            <p className="py-3 text-center text-xs text-gray-400">
              Aún no hay consignaciones.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {deposits.slice(0, 4).map((d) => (
                <li key={d.id} className="py-1.5">
                  <p className="truncate text-sm font-semibold text-gray-800">
                    {formatCOP(d.amount)}
                    {d.senderName && (
                      <span className="font-normal text-gray-500">
                        {' '}
                        · {d.senderName}
                      </span>
                    )}
                  </p>
                  <p className="truncate text-[11px] text-gray-400">
                    {formatDateTime(d.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </ShortcutCard>
      );
    },
  },
  {
    id: 'por-reactivar',
    name: 'Clientes por reactivar',
    applies: () => true,
    Render: ({ data, actions }) => {
      const count = data.home?.winbackCount || 0;
      const inner = (
        <>
          <Label icon={ArrowPathIcon} accent="text-amber-600">
            Por reactivar
          </Label>
          <p className="text-2xl font-bold text-amber-600">{count}</p>
          <p className="text-xs text-gray-500">
            {data.t.customerPlural} sin volver hace 20+ días
          </p>
        </>
      );
      return count > 0 ? (
        <ShortcutCard onClick={actions.openReactivate} hint="Ver y contactar">
          {inner}
        </ShortcutCard>
      ) : (
        <Card>{inner}</Card>
      );
    },
  },
  {
    id: 'proximas-citas',
    name: 'Próximas citas',
    applies: (data) => data.isServices,
    Render: ({ data }) => {
      const items = data.home?.nextAppointments || [];
      return (
        <ShortcutCard href="/dashboard/appointments" hint="Ver">
          <Label icon={CalendarDaysIcon} accent="text-gray-500">
            Próximas citas
          </Label>
          {items.length === 0 ? (
            <p className="py-3 text-center text-xs text-gray-400">
              Sin citas próximas.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {items.slice(0, 4).map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="truncate text-gray-700">
                    {a.customer?.name || 'Cliente'}
                  </span>
                  <span className="flex-none text-xs text-gray-400">
                    {a.date?.slice(8, 10)}/{a.date?.slice(5, 7)} ·{' '}
                    {a.startTime || ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ShortcutCard>
      );
    },
  },
  {
    id: 'mes',
    name: 'Resumen del mes',
    applies: (data) => data.isAdmin,
    Render: ({ data }) => {
      const mth = data.home?.month;
      const profitAccent =
        (mth?.profit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600';
      return (
        <ShortcutCard href="/dashboard/statistics" hint="Ver detalle">
          <Label>Este mes</Label>
          <ul className="space-y-1.5">
            <MoneyRow
              label={data.t.salePlural}
              value={mth ? formatCOP(mth.sales) : '—'}
              accent="text-emerald-600"
            />
            <MoneyRow
              label="Gastos"
              value={mth ? formatCOP(mth.expenses) : '—'}
              accent="text-red-600"
            />
            <MoneyRow
              label="Utilidad"
              value={mth ? formatCOP(mth.profit) : '—'}
              accent={profitAccent}
              strong
            />
          </ul>
        </ShortcutCard>
      );
    },
  },
  {
    id: 'por-cobrar',
    name: 'Por cobrar (fiado)',
    applies: () => true,
    Render: ({ data }) => (
      <ShortcutCard href="/dashboard/cartera" hint="Ver cartera">
        <Label icon={CreditCardIcon} accent="text-orange-600">
          Por cobrar
        </Label>
        <p className="truncate text-2xl font-bold tabular-nums text-orange-600">
          {formatCOP(data.receivable || 0)}
        </p>
      </ShortcutCard>
    ),
  },
  {
    id: 'cumpleanos',
    name: 'Cumpleaños del equipo',
    applies: () => true,
    Render: ({ data }) => {
      const items = data.teamBirthdays || [];
      return (
        <Card>
          <Label icon={GiftIcon} accent="text-pink-500">
            Cumpleaños del equipo
          </Label>
          {items.length === 0 ? (
            <p className="py-3 text-center text-xs text-gray-400">
              El equipo no tiene fechas de cumpleaños registradas.
            </p>
          ) : (
            <ul className="space-y-1">
              {items.slice(0, 6).map((b, i) => (
                <li key={b.id ?? i} className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-700">
                    {b.name}
                  </p>
                  <p className="text-xs text-gray-400">🎂 {b.date}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      );
    },
  },
  {
    id: 'calculadora',
    name: 'Calculadora',
    applies: () => true,
    Render: () => <CalculatorWidget />,
  },

  // ---- Widgets del BARBERO (SOLO lo que él gana) ----
  {
    id: 'mi-hoy',
    name: 'Mi día',
    applies: () => true,
    Render: ({ data, actions }) => {
      const perf = data.myPerf;
      const p = perf?.today;
      const conf = perf?.ratesConfigured;
      return (
        <ShortcutCard onClick={() => actions.openDetail('today')} hint="Ver detalle">
          <Label>Hoy en cortes</Label>
          <div className="grid grid-cols-2 gap-2">
            <Stat
              label="Ganas hoy"
              value={conf && p ? formatCOP(p.earnings.service) : '—'}
              accent="text-emerald-600"
            />
            <Stat label="Cortes" value={p ? p.cuts : '—'} />
          </div>
          {perf && !conf && <NoRateNote />}
        </ShortcutCard>
      );
    },
  },
  {
    id: 'mi-semana',
    name: 'Mi semana',
    applies: () => true,
    Render: ({ data, actions }) => {
      const perf = data.myPerf;
      const p = perf?.week;
      const conf = perf?.ratesConfigured;
      return (
        <ShortcutCard onClick={() => actions.openDetail('week')}>
          <div className="mb-1 flex items-center justify-between">
            <Label>Esta semana en cortes</Label>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                actions.openWeeklyHistory();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  actions.openWeeklyHistory();
                }
              }}
              className="text-xs font-medium text-orange-600 hover:underline"
            >
              Ver historial
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {conf && p ? formatCOP(p.earnings.service) : '—'}
          </p>
          <p className="text-xs text-gray-500">
            {p ? `${p.cuts} cortes · ${p.range}` : 'domingo a sábado'}
          </p>
        </ShortcutCard>
      );
    },
  },
  {
    id: 'mi-mes',
    name: 'Mi mes y comisión',
    applies: () => true,
    Render: ({ data, actions }) => {
      const perf = data.myPerf;
      const p = perf?.month;
      if (!p) {
        return (
          <Card>
            <Label>Este mes</Label>
            <p className="py-3 text-center text-xs text-gray-400">—</p>
          </Card>
        );
      }
      const rates = perf?.rates || {};
      return (
        <ShortcutCard onClick={() => actions.openDetail('month')} hint="Ver detalle">
          <Label icon={GiftIcon} accent="text-violet-500">
            Este mes
          </Label>
          {p.range && (
            <p className="-mt-1 mb-1.5 text-[11px] font-medium text-gray-400">
              {p.range}
            </p>
          )}
          {perf.ratesConfigured ? (
            <>
              <div className="rounded-xl bg-emerald-500/10 p-3">
                <p className="text-[11px] font-medium text-emerald-700">
                  Comisión de productos ({rates.product}%)
                  {p.payDay ? ` · se paga el ${p.payDay}` : ' · se paga el 3'}
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCOP(p.earnings.product)}
                </p>
              </div>
              <ul className="mt-2 space-y-1 border-t border-gray-100 pt-2 text-sm">
                <li className="flex items-center justify-between border-b border-gray-100 pb-1 font-bold text-emerald-700">
                  <span>Total ganado este mes</span>
                  <span>{formatCOP(p.earnings.total)}</span>
                </li>
                <li className="flex items-center justify-between text-gray-600">
                  <span>Cortes del mes ({rates.service}%)</span>
                  <span className="font-semibold text-gray-800">
                    {formatCOP(p.earnings.service)}
                  </span>
                </li>
                <li className="flex items-center justify-between text-gray-500">
                  <span>Nº de cortes</span>
                  <span className="font-semibold text-gray-700">{p.cuts}</span>
                </li>
              </ul>
              {p.charges > 0 && (
                <div className="mt-2 rounded-xl bg-red-50 p-2.5 text-sm">
                  <div className="flex items-center justify-between text-red-600">
                    <span>Descuentos (cargos)</span>
                    <span className="font-semibold">−{formatCOP(p.charges)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between border-t border-red-100 pt-1 font-bold text-gray-800">
                    <span>Neto a recibir</span>
                    <span className="text-orange-700">{formatCOP(p.net)}</span>
                  </div>
                </div>
              )}
              <p className="mt-1.5 text-[11px] text-gray-400">
                Cierre del {p.range || 'mes'}. Los cortes se pagan por semana;
                los productos se acumulan y se pagan el{' '}
                {p.payDay || '3 de cada mes'}.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">{p.cuts} cortes este mes</p>
              <NoRateNote />
            </>
          )}
        </ShortcutCard>
      );
    },
  },
  {
    id: 'mis-citas-hoy',
    name: 'Mis citas de hoy',
    applies: () => true,
    Render: ({ data, actions }) => {
      const items = data.todayAppts || [];
      return (
        <ShortcutCard onClick={() => actions.openTodayAppts()} hint="Ver todas">
          <Label icon={CalendarDaysIcon} accent="text-blue-500">
            Mis citas de hoy
          </Label>
          {items.length === 0 ? (
            <p className="py-3 text-center text-xs text-gray-400">
              No tienes citas hoy.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {items.slice(0, 4).map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="truncate text-gray-700">
                    {a.customer?.name || 'Cliente'}
                  </span>
                  <span className="flex-none text-xs text-gray-400">
                    {a.startTime || ''}
                  </span>
                </li>
              ))}
              {items.length > 4 && (
                <li className="text-[11px] text-blue-600">
                  +{items.length - 4} más
                </li>
              )}
            </ul>
          )}
        </ShortcutCard>
      );
    },
  },
  {
    // Lo que el empleado (cualquier rol no-dueño) debe actualmente al negocio.
    id: 'lo-que-debo',
    name: 'Lo que debes',
    applies: (data) => !data.isAdmin && (data.myCharges?.pending || 0) > 0,
    Render: ({ data }) => {
      const mc = data.myCharges || {};
      const list = mc.list || [];
      return (
        <ShortcutCard href="/dashboard/employee-charges" hint="Ver detalle">
          <Label icon={CreditCardIcon} accent="text-red-500">
            Lo que debes
          </Label>
          <p className="mt-1 text-2xl font-bold tabular-nums text-red-600">
            {formatCOP(mc.pending || 0)}
          </p>
          <ul className="mt-2 space-y-1 border-t border-gray-100 pt-2 text-sm">
            {list.slice(0, 4).map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between text-gray-600"
              >
                <span className="truncate pr-2">{c.concept}</span>
                <span className="flex-none font-semibold text-gray-800">
                  {formatCOP(c.amount)}
                </span>
              </li>
            ))}
            {list.length > 4 && (
              <li className="text-[11px] text-gray-400">
                +{list.length - 4} más
              </li>
            )}
          </ul>
          <p className="mt-1.5 text-[11px] text-gray-400">
            Se descuenta de tu pago o lo abonas en efectivo.
          </p>
        </ShortcutCard>
      );
    },
  },
];

// Audiencia de cada widget: 'owner' (dueño/staff), 'barber' (barbero) o 'all'.
export const WIDGET_AUDIENCE = {
  'mi-hoy': 'barber',
  'mi-semana': 'barber',
  'mi-mes': 'barber',
  'mis-citas-hoy': 'barber',
  hoy: 'owner',
  grafica: 'owner',
  inventario: 'owner',
  consignaciones: 'owner',
  'por-reactivar': 'owner',
  'proximas-citas': 'owner',
  mes: 'owner',
  'por-cobrar': 'owner',
  cumpleanos: 'all',
  calculadora: 'all',
  'lo-que-debo': 'all',
};

// Widgets visibles por defecto (se filtran por audiencia según el rol; el
// resto se agregan desde el catálogo).
export const DEFAULT_LAYOUT = [
  // Empleado: lo que debe (aparece si tiene saldo)
  'lo-que-debo',
  // Barbero
  'mi-hoy',
  'mis-citas-hoy',
  'mi-semana',
  'mi-mes',
  // Dueño / staff
  'hoy',
  'grafica',
  'inventario',
  'consignaciones',
  'por-reactivar',
  'proximas-citas',
  'mes',
  'por-cobrar',
  // Común
  'cumpleanos',
];
