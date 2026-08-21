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

      <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl print:max-w-full print:rounded-none print:border-0 print:shadow-none">
        {/* Sello de verificación */}
        <div className="flex items-center gap-3 bg-emerald-600 px-6 py-4 text-white">
          <ShieldCheckIcon className="h-8 w-8 flex-none" />
          <div>
            <p className="text-sm font-bold uppercase tracking-wide">
              Factura verificada
            </p>
            <p className="text-xs text-emerald-50">
              Este comprobante es auténtico y está registrado en nuestro
              sistema.
            </p>
          </div>
        </div>

        {/* Encabezado de la empresa */}
        <div className="flex flex-col items-center gap-3 border-b border-dashed border-gray-200 px-6 py-6 text-center sm:flex-row sm:items-start sm:text-left">
          {c.logo && (
            <div className="flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-xl bg-[#0B0F19]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.logo}
                alt={c.name || 'logo'}
                className="h-full w-full object-contain"
              />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold text-gray-900">
              {c.name || 'Comprobante de venta'}
            </h1>
            {c.nit && <p className="text-sm text-gray-500">NIT: {c.nit}</p>}
            <div className="mt-1 flex flex-col gap-0.5 text-xs text-gray-500 sm:items-start">
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
        <div className="grid grid-cols-2 gap-3 px-6 py-5 text-sm sm:grid-cols-3">
          <Field label="Factura N°" value={sale.code} strong />
          <Field
            label="Fecha"
            icon={CalendarDaysIcon}
            value={formatDateTime(sale.saleDate)}
          />
          <Field
            label="Estado"
            value={sale.paymentStatus}
            badge={
              sale.paymentStatus === 'PAGADA'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            }
          />
          <Field
            label="Cliente"
            icon={UserIcon}
            value={sale.customer?.name}
          />
          {sale.customer?.document && (
            <Field label="Documento" value={sale.customer.document} />
          )}
          <Field
            label="Método de pago"
            icon={CreditCardIcon}
            value={sale.paymentMethod}
          />
          {sale.seller && <Field label="Atendido por" value={sale.seller} />}
        </div>

        {/* Ítems */}
        <div className="px-6 pb-4">
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left">Detalle</th>
                  <th className="px-3 py-2 text-center">Cant.</th>
                  <th className="px-3 py-2 text-right">Precio</th>
                  <th className="px-3 py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(sale.items || []).map((it, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-gray-800">
                      {it.name}
                      {it.color ? (
                        <span className="text-gray-400"> · {it.color}</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-center text-gray-600">
                      {it.quantity}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600">
                      {formatCOP(it.price)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-900">
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
          <div className="ml-auto w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{formatCOP(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Descuento</span>
                <span>- {formatCOP(sale.discount)}</span>
              </div>
            )}
            {/* Desglose fiscal cuando la empresa cobra IVA */}
            {sale.responsableIVA && sale.taxTotal > 0 && (
              <>
                <div className="flex justify-between text-gray-500">
                  <span>Base gravable</span>
                  <span>{formatCOP(sale.taxable)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>IVA</span>
                  <span>{formatCOP(sale.taxTotal)}</span>
                </div>
              </>
            )}
            <div className="mt-2 flex items-center justify-between rounded-xl bg-gray-900 px-4 py-2.5 text-base font-bold text-white">
              <span>TOTAL</span>
              <span>{formatCOP(sale.totalAmount)}</span>
            </div>
          </div>
        </div>

        {sale.notes && (
          <div className="mx-6 mb-4 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
            <span className="font-semibold">Observación: </span>
            {sale.notes}
          </div>
        )}

        <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 text-center text-[11px] text-gray-400">
          Conserva este comprobante para soporte o garantías.
          <br />
          Verificación auténtica generada automáticamente.
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

function Field({ label, value, icon: Icon, strong, badge }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-gray-400">
        {label}
      </p>
      {badge ? (
        <span
          className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${badge}`}
        >
          {value || '—'}
        </span>
      ) : (
        <p
          className={`flex items-center gap-1 ${
            strong ? 'text-base font-bold text-gray-900' : 'text-sm font-medium text-gray-800'
          }`}
        >
          {Icon && <Icon className="h-3.5 w-3.5 flex-none text-gray-400" />}
          {value || '—'}
        </p>
      )}
    </div>
  );
}
