'use client';

import { useCallback, useEffect, useState } from 'react';
import { getTaxReport } from '@/lib/api/routes/statistics';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { ChartCard, formatMoney } from './statsUI';

// Reporte de IVA del periodo: generado (ventas) vs descontable (compras) → neto.
export default function TaxReport({ startDate, endDate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTax = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTaxReport({ startDate, endDate });
      if (res?.success) setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchTax();
  }, [fetchTax]);

  const iva = data?.iva;
  const ventas = data?.ventas;
  const compras = data?.compras;

  return (
    <div className="relative space-y-6">
      {loading && <LoadingOverlay />}

      <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Base para tu declaración de IVA: el IVA que cobraste en ventas menos el
        que pagaste en compras. Rango: {data?.range?.startDate} a{' '}
        {data?.range?.endDate}.
      </p>

      {/* Tarjetas resumen */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            IVA generado (ventas)
          </p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-900">
            {formatMoney(iva?.generado)}
          </p>
        </div>
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
            IVA descontable (compras)
          </p>
          <p className="mt-1 text-2xl font-extrabold text-orange-900">
            {formatMoney(iva?.descontable)}
          </p>
        </div>
        <div
          className={`rounded-2xl border p-4 ${
            (iva?.aPagar || 0) > 0
              ? 'border-red-200 bg-red-50'
              : 'border-emerald-200 bg-emerald-50'
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
            {(iva?.aPagar || 0) > 0 ? 'IVA a pagar' : 'Saldo a favor'}
          </p>
          <p
            className={`mt-1 text-2xl font-extrabold ${
              (iva?.aPagar || 0) > 0 ? 'text-red-700' : 'text-emerald-700'
            }`}
          >
            {formatMoney((iva?.aPagar || 0) > 0 ? iva?.aPagar : iva?.aFavor)}
          </p>
        </div>
      </div>

      {/* Detalle ventas / compras */}
      <ChartCard title="Detalle del periodo" subtitle="Ventas y compras con su IVA">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="py-2 pr-4">Concepto</th>
                <th className="py-2 pr-4 text-right">Base gravable</th>
                <th className="py-2 pr-4 text-right">IVA</th>
                <th className="py-2 pr-4 text-right">Total</th>
                <th className="py-2 pl-4 text-right">Nº docs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <tr className="text-gray-700">
                <td className="py-2.5 pr-4 font-medium text-gray-800">
                  Ventas (IVA generado)
                </td>
                <td className="py-2.5 pr-4 text-right">{formatMoney(ventas?.base)}</td>
                <td className="py-2.5 pr-4 text-right font-semibold text-emerald-600">
                  {formatMoney(ventas?.iva)}
                </td>
                <td className="py-2.5 pr-4 text-right">{formatMoney(ventas?.total)}</td>
                <td className="py-2.5 pl-4 text-right text-gray-500">
                  {ventas?.count ?? 0}
                </td>
              </tr>
              <tr className="text-gray-700">
                <td className="py-2.5 pr-4 font-medium text-gray-800">
                  Compras (IVA descontable)
                </td>
                <td className="py-2.5 pr-4 text-right">{formatMoney(compras?.base)}</td>
                <td className="py-2.5 pr-4 text-right font-semibold text-orange-600">
                  {formatMoney(compras?.iva)}
                </td>
                <td className="py-2.5 pr-4 text-right">{formatMoney(compras?.total)}</td>
                <td className="py-2.5 pl-4 text-right text-gray-500">
                  {compras?.count ?? 0}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 font-bold text-gray-900">
                <td className="py-3 pr-4" colSpan={2}>
                  {(iva?.aPagar || 0) > 0 ? 'IVA a pagar' : 'Saldo a favor'}
                </td>
                <td
                  className={`py-3 pr-4 text-right ${
                    (iva?.aPagar || 0) > 0 ? 'text-red-600' : 'text-emerald-600'
                  }`}
                  colSpan={3}
                >
                  {formatMoney((iva?.aPagar || 0) > 0 ? iva?.aPagar : iva?.aFavor)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
