'use client';

import {
  XMarkIcon,
  PrinterIcon,
  PencilSquareIcon,
  UserIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  MapPinIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { formatCOP, formatDateTime } from '@/lib/api/utils/utils';

const STATUS = {
  PAGADA: { label: 'Pagada', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  FIADO: { label: 'Crédito (fiado)', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  PENDIENTE: { label: 'Pendiente', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  PLAN_SEPARE: { label: 'Plan separe', cls: 'bg-orange-50 text-orange-700 ring-orange-200' },
  EN_VALIDACION: { label: 'En validación', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  ANULADO: { label: 'Anulado', cls: 'bg-red-50 text-red-700 ring-red-200' },
  REEMBOLSADO: { label: 'Reembolsado', cls: 'bg-gray-100 text-gray-600 ring-gray-200' },
  DEVUELTA: { label: 'Devuelta', cls: 'bg-red-50 text-red-700 ring-red-200' },
};

const itemName = (it) =>
  it.name || it?.variant?.inventory?.name || it?.service?.name || 'Ítem';
const itemColor = (it) => {
  const c = it.color ?? it?.variant?.color;
  return c && !['ÚNICO', 'UNICO', 'GENERAL'].includes(String(c).toUpperCase())
    ? c
    : null;
};

export default function SaleDetailModal({ sale, usuario, onClose, onPrint }) {
  if (!sale) return null;

  const items = Array.isArray(sale.items) ? sale.items : [];
  const itemsSum = items.reduce(
    (a, i) => a + (Number(i.price) || 0) * (Number(i.quantity) || 0),
    0,
  );
  const discountTotal = items.reduce((a, i) => a + (Number(i.discount) || 0), 0);
  const taxTotal = Number(sale.taxTotal) || 0;
  const total = Number(sale.totalAmount) || 0;
  const st = STATUS[sale.paymentStatus] || {
    label: sale.paymentStatus || '—',
    cls: 'bg-gray-100 text-gray-600 ring-gray-200',
  };
  const canEdit = ['SUPER_ADMIN', 'ADMIN'].includes(usuario?.role);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-3 pt-[5vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-orange-600 to-[#111827] px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                Venta
              </p>
              <h2 className="truncate text-xl font-bold">{sale.code}</h2>
              <p className="mt-0.5 text-xs text-white/70">
                {formatDateTime(sale.saleDate)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${st.cls}`}
              >
                {st.label}
              </span>
              <button
                onClick={onClose}
                className="rounded-full p-1 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <span className="text-[11px] uppercase tracking-wide text-white/60">
              Total
            </span>
            <span className="text-2xl font-extrabold tabular-nums">
              {formatCOP(total)}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Datos */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            <Info icon={UserIcon} label="Cliente" value={sale.customer?.name || 'Consumidor final'} />
            {sale.customer?.document && (
              <Info label="Documento" value={sale.customer.document} />
            )}
            <Info icon={CreditCardIcon} label="Método de pago" value={sale.paymentMethod} />
            <Info icon={CalendarDaysIcon} label="Fecha" value={formatDateTime(sale.saleDate)} />
            {sale.local?.name && (
              <Info icon={BuildingStorefrontIcon} label="Local" value={sale.local.name} />
            )}
            {sale.user?.name && (
              <Info icon={MapPinIcon} label="Vendedor" value={sale.user.name} />
            )}
          </div>

          {/* Productos */}
          <p className="mb-2 mt-5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Productos y servicios
          </p>
          <div className="overflow-hidden rounded-2xl ring-1 ring-gray-100">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-[10px] uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-2.5 text-left font-bold">Detalle</th>
                  <th className="px-2 py-2.5 text-center font-bold">Cant.</th>
                  <th className="px-2 py-2.5 text-right font-bold">Precio</th>
                  <th className="px-4 py-2.5 text-right font-bold">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => {
                  const color = itemColor(it);
                  const disc = Number(it.discount) || 0;
                  return (
                    <tr key={i} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-2.5 text-gray-800">
                        <span className="font-medium">{itemName(it)}</span>
                        {color ? (
                          <span className="text-gray-400"> · {color}</span>
                        ) : null}
                        {disc > 0 && (
                          <span className="ml-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                            −{formatCOP(disc)}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-center tabular-nums text-gray-500">
                        {it.quantity}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-gray-500">
                        {formatCOP(it.price)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-gray-900">
                        {formatCOP(it.subtotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="ml-auto mt-4 w-full max-w-xs rounded-2xl bg-gray-50 p-4 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCOP(itemsSum)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="my-2 flex items-center justify-between rounded-lg border border-dashed border-emerald-300 bg-emerald-50 px-3 py-1.5 font-bold text-emerald-700">
                <span>Descuento</span>
                <span className="tabular-nums">− {formatCOP(discountTotal)}</span>
              </div>
            )}
            {taxTotal > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>IVA</span>
                <span className="tabular-nums">{formatCOP(taxTotal)}</span>
              </div>
            )}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-gray-900 px-4 py-2.5 text-base font-extrabold text-white">
              <span>TOTAL</span>
              <span className="tabular-nums">{formatCOP(total)}</span>
            </div>
          </div>

          {sale.notes && (
            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500">
              <span className="font-semibold text-gray-600">Observación: </span>
              {sale.notes}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
          {canEdit && (
            <Link
              href={`/dashboard/delivered_sales/edit/${sale.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              <PencilSquareIcon className="h-4 w-4" /> Editar
            </Link>
          )}
          <button
            onClick={() => onPrint?.(sale)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700"
          >
            <PrinterIcon className="h-4 w-4" /> Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, icon: Icon }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
        {Icon && <Icon className="h-3.5 w-3.5 flex-none text-gray-400" />}
        <span className="truncate">{value || '—'}</span>
      </p>
    </div>
  );
}
