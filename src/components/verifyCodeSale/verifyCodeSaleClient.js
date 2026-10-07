'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ShieldCheckIcon,
  XCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/solid';
import {
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import useDeliveredSales from '@/lib/api/hooks/useDeliveredSales';
import { formatCOP, formatDateTime } from '@/lib/api/utils/utils';

export default function VerifyCodeSaleClient() {
  const { getVerifyCodeSale, loading, error } = useDeliveredSales();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  const [sale, setSale] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) return;
    (async () => {
      try {
        const res = await getVerifyCodeSale(code);
        const data = res?.data || res;
        setSale(data);
        setNotFound(false);
        // El título define el nombre por defecto del PDF al imprimir.
        if (typeof document !== 'undefined' && data?.code) {
          document.title = `Factura ${data.code}`;
        }
      } catch {
        setNotFound(true);
      }
    })();
  }, [code, getVerifyCodeSale]);

  if (loading) {
    return (
      <Centered>
        <DocumentTextIcon className="mx-auto mb-3 h-12 w-12 animate-pulse text-orange-600" />
        <p className="text-sm text-gray-600">Verificando factura…</p>
      </Centered>
    );
  }

  if (!code) {
    return (
      <Centered>
        <DocumentTextIcon className="mx-auto mb-4 h-14 w-14 text-gray-400" />
        <h2 className="mb-1 text-xl font-bold text-gray-800">
          Verificación de factura
        </h2>
        <p className="text-sm text-gray-500">
          No se proporcionó un código de factura para validar.
        </p>
      </Centered>
    );
  }

  if (notFound || error || !sale) {
    return (
      <Centered>
        <XCircleIcon className="mx-auto mb-4 h-16 w-16 text-red-500" />
        <h2 className="mb-2 text-xl font-bold text-gray-800">
          Factura no válida
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Este código no corresponde a una venta registrada en nuestro sistema.
        </p>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          Código: <span className="font-semibold">{code}</span>
        </div>
      </Centered>
    );
  }

  const c = sale.company || {};
  const local = sale.local || {};

  // Estado legible (en vez del enum crudo).
  const STATUS_LABEL = {
    PAGADA: 'Pagada',
    PLAN_SEPARE: 'Plan separe',
    FIADO: 'Crédito (fiado)',
    PENDIENTE: 'Pendiente',
    EN_VALIDACION: 'En validación',
    RECHAZADA: 'Rechazada',
    VENCIDO: 'Vencido',
    REEMBOLSADO: 'Reembolsado',
    ANULADO: 'Anulado',
  };
  const statusLabel = STATUS_LABEL[sale.paymentStatus] || sale.paymentStatus;
  const statusBadge =
    sale.paymentStatus === 'PAGADA'
      ? 'bg-emerald-50 text-emerald-700'
      : sale.isLayaway
        ? 'bg-orange-50 text-orange-700'
        : 'bg-amber-50 text-amber-700';
  // Progreso de pago del apartado.
  const pct =
    sale.isLayaway && sale.totalAmount > 0
      ? Math.min(100, Math.round((Number(sale.paid) / Number(sale.totalAmount)) * 100))
      : 0;

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8 print:bg-white print:p-0">
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { margin: 12mm; }
        }
      `}</style>
      {/* Barra de acciones (no se imprime) */}
      <div className="mx-auto mb-3 flex max-w-2xl justify-end print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
        >
          <PrinterIcon className="h-5 w-5" />
          Imprimir / Guardar PDF
        </button>
      </div>

      <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-gray-900/5 print:max-w-full print:rounded-none print:shadow-none print:ring-0">
        {/* Sello de verificación (verde para factura, ámbar para plan separe) */}
        <div
          className={`px-6 py-5 text-white ${
            sale.isLayaway
              ? 'bg-gradient-to-r from-amber-500 to-orange-500'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
              <ShieldCheckIcon className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold uppercase tracking-wide">
                {sale.isLayaway
                  ? 'Plan separe verificado'
                  : 'Factura verificada'}
              </p>
              <p className="text-xs text-white/80">
                {sale.isLayaway
                  ? 'Apartado en curso, registrado en nuestro sistema.'
                  : 'Comprobante auténtico, registrado en nuestro sistema.'}
              </p>
            </div>
            <span className="flex-none rounded-lg bg-white/15 px-2.5 py-1 text-xs font-bold ring-1 ring-white/20">
              N° {sale.code}
            </span>
          </div>
        </div>

        {/* Encabezado de la empresa */}
        <div className="flex items-center gap-4 border-b border-gray-100 px-6 py-5">
          {c.logo ? (
            <div className="flex h-14 w-14 flex-none items-center justify-center overflow-hidden rounded-2xl bg-[#0B0F19] ring-1 ring-gray-900/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.logo}
                alt={c.name || 'logo'}
                className="h-full w-full object-contain"
              />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-extrabold text-gray-900">
              {c.name || 'Comprobante de venta'}
            </h1>
            {c.nit && <p className="text-xs text-gray-500">NIT {c.nit}</p>}
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
              {(local.address || local.city) && (
                <span className="inline-flex items-center gap-1">
                  <MapPinIcon className="h-3.5 w-3.5" />
                  {[local.name, local.address, local.city]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              )}
              {(c.phone || local.phone) && (
                <span className="inline-flex items-center gap-1">
                  <PhoneIcon className="h-3.5 w-3.5" />
                  {c.phone || local.phone}
                </span>
              )}
              {c.email && (
                <span className="inline-flex items-center gap-1">
                  <EnvelopeIcon className="h-3.5 w-3.5" />
                  {c.email}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Datos de la factura */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 px-6 py-5 sm:grid-cols-3">
          <Field
            label="Fecha"
            icon={CalendarDaysIcon}
            value={formatDateTime(sale.saleDate)}
          />
          <Field label="Estado" value={statusLabel} badge={statusBadge} />
          <Field
            label="Método de pago"
            icon={CreditCardIcon}
            value={sale.paymentMethod}
          />
          <Field label="Cliente" icon={UserIcon} value={sale.customer?.name} />
          {sale.customer?.document && (
            <Field label="Documento" value={sale.customer.document} />
          )}
          {sale.seller && <Field label="Atendido por" value={sale.seller} />}
        </dl>

        {/* Plan separe (apartado): progreso, abonado y saldo pendiente */}
        {sale.isLayaway && (
          <div className="mx-6 mb-2 rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 px-5 py-4">
            <p className="text-xs font-extrabold uppercase tracking-wide text-orange-700">
              Plan separe · apartado en curso
            </p>
            <p className="mt-0.5 text-[11px] text-orange-700/80">
              La factura final se entrega al completar el pago.
            </p>

            <div className="mt-3 grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-500">
                  Total
                </p>
                <p className="text-lg font-extrabold text-gray-900">
                  {formatCOP(sale.totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-500">
                  Abonado
                </p>
                <p className="text-lg font-extrabold text-emerald-600">
                  {formatCOP(sale.paid)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-500">
                  Saldo
                </p>
                <p className="text-lg font-extrabold text-orange-700">
                  {formatCOP(sale.saldo)}
                </p>
              </div>
            </div>

            {/* Barra de progreso de pago */}
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[11px] font-semibold text-gray-500">
                <span>Pagado {pct}%</span>
                {sale.saldo > 0 ? (
                  <span>Faltan {formatCOP(sale.saldo)}</span>
                ) : (
                  <span className="text-emerald-600">Listo para entregar</span>
                )}
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-orange-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Abonos realizados (con fecha) */}
            {sale.payments?.length > 0 && (
              <div className="mt-4">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-orange-700">
                  Abonos realizados
                </p>
                <ul className="space-y-1">
                  {sale.payments.map((p, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-1.5 text-xs"
                    >
                      <span className="text-gray-600">
                        {formatDateTime(p.paidAt)}
                        {p.method ? (
                          <span className="text-gray-400"> · {p.method}</span>
                        ) : null}
                      </span>
                      <span className="font-bold text-emerald-600">
                        {formatCOP(p.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Ítems */}
        <div className="px-6 pb-5">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Detalle
          </p>
          <div className="overflow-hidden rounded-2xl ring-1 ring-gray-100">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-[10px] uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-2.5 text-left font-bold">Producto</th>
                  <th className="px-2 py-2.5 text-center font-bold">Cant.</th>
                  <th className="px-2 py-2.5 text-right font-bold">Precio</th>
                  <th className="px-4 py-2.5 text-right font-bold">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(sale.items || []).map((it, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <td className="px-4 py-2.5 text-gray-800">
                      <span className="font-medium">{it.name}</span>
                      {it.color ? (
                        <span className="text-gray-400"> · {it.color}</span>
                      ) : null}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totales */}
        <div className="px-6 pb-6">
          <div className="ml-auto w-full max-w-xs rounded-2xl bg-gray-50 p-4 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCOP(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="my-2 flex items-center justify-between rounded-lg border border-dashed border-emerald-300 bg-emerald-50 px-3 py-1.5 font-bold text-emerald-700">
                <span>Descuento</span>
                <span className="tabular-nums">− {formatCOP(sale.discount)}</span>
              </div>
            )}
            {/* Desglose fiscal cuando la empresa cobra IVA */}
            {sale.responsableIVA && sale.taxTotal > 0 && (
              <>
                <div className="flex justify-between text-gray-500">
                  <span>Base gravable</span>
                  <span className="tabular-nums">{formatCOP(sale.taxable)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>IVA</span>
                  <span className="tabular-nums">{formatCOP(sale.taxTotal)}</span>
                </div>
              </>
            )}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-gray-900 px-4 py-2.5 text-base font-extrabold text-white">
              <span>{sale.isLayaway ? 'TOTAL APARTADO' : 'TOTAL'}</span>
              <span className="tabular-nums">{formatCOP(sale.totalAmount)}</span>
            </div>
          </div>
        </div>

        {sale.notes && (
          <div className="mx-6 mb-5 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500">
            <span className="font-semibold text-gray-600">Observación: </span>
            {sale.notes}
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 border-t border-gray-100 bg-gray-50/60 px-6 py-4 text-center text-[11px] text-gray-400">
          <ShieldCheckIcon className="h-3.5 w-3.5 flex-none text-gray-300" />
          Comprobante verificado automáticamente · Consérvalo para soporte o
          garantías.
        </div>
      </div>
    </div>
  );
}

function Centered({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, icon: Icon, badge }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </dt>
      {badge ? (
        <dd
          className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${badge}`}
        >
          {value || '—'}
        </dd>
      ) : (
        <dd className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
          {Icon && <Icon className="h-3.5 w-3.5 flex-none text-gray-400" />}
          <span className="truncate">{value || '—'}</span>
        </dd>
      )}
    </div>
  );
}
