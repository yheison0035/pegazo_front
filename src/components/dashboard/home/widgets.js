'use client';

import Link from 'next/link';
import {
  BanknotesIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  GiftIcon,
  ArrowRightIcon,
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
    <div className="rounded-xl bg-gray-50 px-3 py-2">
      <p className={`text-lg font-bold ${accent}`}>{value}</p>
      <p className="text-[11px] font-medium text-gray-500">{label}</p>
    </div>
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

// Cada widget: id, nombre (catálogo), wide (ocupa toda la fila), applies(data)
// y Render({data, actions}). Todo se sincroniza con el tema vía tokens.
export const WIDGETS = [
  {
    id: 'hoy',
    name: 'Resumen de hoy',
    applies: () => true,
    Render: ({ data }) => {
      const { home, todayAppts, isServices } = data;
      const byMethod = home?.today?.byMethod || [];
      return (
        <Card>
          <Label>Hoy</Label>
          <div
            className={`grid gap-2 ${isServices ? 'grid-cols-3' : 'grid-cols-2'}`}
          >
            <Stat
              label={`${data.t.salePlural}`}
              value={home ? formatCOP(home.today.total) : '—'}
              accent="text-emerald-600"
            />
            <Stat label="Nº de hoy" value={home ? home.today.count : '—'} />
            {isServices && (
              <Stat
                label="Citas"
                value={todayAppts ? todayAppts.length : '—'}
              />
            )}
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
        </Card>
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
      return (
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <Label icon={ExclamationTriangleIcon} accent="text-gray-500">
              Inventario
            </Label>
            {items.length > 0 && (
              <button
                type="button"
                onClick={actions.openLowStock}
                className="text-xs font-medium text-amber-600"
              >
                Ver detalle
              </button>
            )}
          </div>
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
        </Card>
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
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <Label icon={BanknotesIcon} accent="text-emerald-600">
              Consignaciones
            </Label>
            <Link
              href="/dashboard/bank"
              className="text-xs font-medium text-emerald-600 hover:underline"
            >
              Ver todas
            </Link>
          </div>
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
        </Card>
      );
    },
  },
  {
    id: 'por-reactivar',
    name: 'Clientes por reactivar',
    applies: () => true,
    Render: ({ data, actions }) => (
      <Card>
        <Label icon={ArrowPathIcon} accent="text-amber-600">
          Por reactivar
        </Label>
        <p className="text-2xl font-bold text-amber-600">
          {data.home?.winbackCount || 0}
        </p>
        <p className="text-xs text-gray-500">
          {data.t.customerPlural} sin volver hace 20+ días
        </p>
        {(data.home?.winbackCount || 0) > 0 && (
          <button
            type="button"
            onClick={actions.openReactivate}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-600"
          >
            Ver y contactar <ArrowRightIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </Card>
    ),
  },
  {
    id: 'proximas-citas',
    name: 'Próximas citas',
    applies: (data) => data.isServices,
    Render: ({ data }) => {
      const items = data.home?.nextAppointments || [];
      return (
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <Label icon={CalendarDaysIcon} accent="text-gray-500">
              Próximas citas
            </Label>
            <Link
              href="/dashboard/appointments"
              className="text-xs font-medium text-gray-500 hover:underline"
            >
              Ver
            </Link>
          </div>
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
        </Card>
      );
    },
  },
  {
    id: 'mes',
    name: 'Resumen del mes',
    applies: (data) => data.isAdmin,
    Render: ({ data }) => {
      const mth = data.home?.month;
      return (
        <Card>
          <Label>Este mes</Label>
          <div className="grid grid-cols-3 gap-2">
            <Stat
              label={data.t.salePlural}
              value={mth ? formatCOP(mth.sales) : '—'}
              accent="text-emerald-600"
            />
            <Stat
              label="Gastos"
              value={mth ? formatCOP(mth.expenses) : '—'}
              accent="text-red-600"
            />
            <Stat
              label="Utilidad"
              value={mth ? formatCOP(mth.profit) : '—'}
              accent={
                (mth?.profit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
              }
            />
          </div>
        </Card>
      );
    },
  },
  {
    id: 'por-cobrar',
    name: 'Por cobrar (fiado)',
    applies: () => true,
    Render: ({ data }) => (
      <Card>
        <Label icon={CreditCardIcon} accent="text-orange-600">
          Por cobrar
        </Label>
        <p className="text-2xl font-bold text-orange-600">
          {formatCOP(data.receivable || 0)}
        </p>
        <Link
          href="/dashboard/cartera"
          className="mt-1 inline-block text-xs font-medium text-gray-500 hover:underline"
        >
          Ver cartera
        </Link>
      </Card>
    ),
  },
  {
    id: 'cumpleanos',
    name: 'Cumpleaños',
    applies: () => true,
    Render: ({ data }) => {
      const items = data.home?.birthdays || [];
      return (
        <Card>
          <Label icon={GiftIcon} accent="text-pink-500">
            Cumpleaños
          </Label>
          {items.length === 0 ? (
            <p className="py-3 text-center text-xs text-gray-400">
              Ninguno esta semana.
            </p>
          ) : (
            <ul className="space-y-1">
              {items.slice(0, 5).map((b, i) => (
                <li
                  key={b.id ?? i}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="truncate text-gray-700">{b.name}</span>
                  <span className="flex-none text-xs text-gray-400">
                    {b.date}
                  </span>
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
];

// Widgets visibles por defecto (el resto se agregan desde el catálogo).
export const DEFAULT_LAYOUT = [
  'hoy',
  'grafica',
  'inventario',
  'consignaciones',
  'por-reactivar',
  'proximas-citas',
  'mes',
  'por-cobrar',
];
