'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  XMarkIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  BuildingStorefrontIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';

import Button from '@/components/ui/Button';
import useLocals from '@/lib/api/hooks/useLocals';
import useDeliveredSales from '@/lib/api/hooks/useDeliveredSales';
import { formatCOP } from '@/lib/api/utils/utils';

const PAYMENT_LABELS = {
  EFECTIVO: 'Efectivo',
  BANCOLOMBIA: 'Bancolombia',
  TRANSFERENCIA: 'Transferencia',
  DATAFONO: 'Datáfono',
  ADDI: 'Addi',
};

export default function ServicePerformanceModal({ onClose }) {
  const [locals, setLocals] = useState([]);
  const [localId, setLocalId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [result, setResult] = useState(null);
  const [globalTotal, setGlobalTotal] = useState(0);
  const [paymentBreakdown, setPaymentBreakdown] = useState({});
  const [commissionRate, setCommissionRate] = useState(0.45);
  const [previousRate, setPreviousRate] = useState(0.4);
  const [changeDate, setChangeDate] = useState('');
  const [loading, setLoading] = useState(false);

  const { getLocals } = useLocals();
  const { getServicePerformanceReport } = useDeliveredSales();

  // =========================
  // LOAD LOCALS
  // =========================
  const fetchInitialData = useCallback(async () => {
    try {
      const res = await getLocals();
      setLocals(res?.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [getLocals]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // =========================
  // FETCH REPORT
  // =========================
  const handleFetch = async () => {
    setLoading(true);
    try {
      const res = await getServicePerformanceReport({
        startDate,
        endDate,
        localId,
      });

      setResult(res.data || {});
      setGlobalTotal(res.globalTotal || 0);
      setPaymentBreakdown(res.paymentBreakdown || {});
      setCommissionRate(res.commissionRate ?? 0.45);
      setPreviousRate(res.previousCommissionRate ?? 0.4);
      setChangeDate(res.commissionRateChangeDate || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="relative bg-gradient-to-r from-[#111827] to-[#374151] px-4 py-5 sm:px-8 sm:py-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-300 hover:text-white transition cursor-pointer"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3">
            <ChartBarIcon className="w-8 h-8 text-purple-400" />
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Reporte de Servicios y Productos
              </h2>
              <p className="text-sm text-gray-300">Productividad por usuario</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-4 py-5 sm:px-8 sm:py-6 border-b border-gray-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 [&>*]:min-w-0">
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-600">
                <CalendarDaysIcon className="w-4 h-4" />
                Desde
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2 text-sm"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-600">
                <CalendarDaysIcon className="w-4 h-4" />
                Hasta
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2 text-sm"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-600">
                <BuildingStorefrontIcon className="w-4 h-4" />
                Local
              </label>
              <select
                value={localId}
                onChange={(e) => setLocalId(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2 text-sm"
              >
                <option value="">Seleccione</option>
                {locals.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="mt-6"
            onClick={handleFetch}
            disabled={!startDate || !endDate || !localId}
            loading={loading}
          >
            Generar reporte
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-6 space-y-6 bg-gray-100">
          {!result && (
            <div className="text-center text-gray-400 py-20">
              Selecciona los filtros para visualizar el reporte
            </div>
          )}

          {result && (
            <>
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex justify-between items-center">
                <span className="text-sm text-gray-600">Total generado</span>
                <span className="text-2xl font-bold text-purple-600">
                  {formatCOP(globalTotal)}
                </span>
              </div>

              {Object.keys(paymentBreakdown).length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                  <p className="mb-4 text-sm font-semibold text-gray-700">
                    Recaudo por método de pago
                  </p>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {Object.entries(paymentBreakdown).map(([method, amount]) => (
                      <div
                        key={method}
                        className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                      >
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          {PAYMENT_LABELS[method] || method}
                        </p>
                        <p className="text-lg font-bold text-gray-800">
                          {formatCOP(amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {changeDate && (
                <p className="px-1 text-xs text-gray-500">
                  Comisión de barberos:{' '}
                  <span className="font-semibold">
                    {Math.round(commissionRate * 100)}%
                  </span>{' '}
                  desde el {changeDate.split('-').reverse().join('/')} ·{' '}
                  {Math.round(previousRate * 100)}% en fechas anteriores.
                </p>
              )}

              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
                      <tr>
                        <th className="text-left px-4 py-3 border-b">
                          Usuario
                        </th>
                        <th className="text-left px-4 py-3 border-b">
                          Detalle
                        </th>
                        <th className="text-center px-4 py-3 border-b">
                          Cantidad
                        </th>
                        <th className="text-right px-4 py-3 border-b">Total</th>
                        <th className="text-right px-4 py-3 border-b text-green-700">
                          Cortes
                          <span className="block text-[10px] font-normal normal-case text-gray-400">
                            se paga el sábado
                          </span>
                        </th>
                        <th className="text-right px-4 py-3 border-b text-blue-700">
                          Productos
                          <span className="block text-[10px] font-normal normal-case text-gray-400">
                            se paga del 3 al 2
                          </span>
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {Object.entries(result).map(([user, data]) => {
                        const weeklyNet =
                          data.totals.netCommission ??
                          data.totals.servicesCommission ??
                          0;
                        return (
                          <React.Fragment key={user}>
                            <tr className="bg-gray-50 border-t">
                              <td
                                colSpan="6"
                                className="px-4 py-3 font-bold text-gray-800"
                              >
                                {user}
                                {data.ratesConfigured ? (
                                  <span className="ml-2 text-xs font-medium text-gray-500">
                                    (Cortes {data.serviceRate ?? 0}% · Productos{' '}
                                    {data.productRate ?? 0}%)
                                  </span>
                                ) : (
                                  <span className="ml-2 text-xs font-medium text-amber-600">
                                    sin % configurado
                                  </span>
                                )}
                              </td>
                            </tr>

                            {Object.entries(data.services).map(([name, s]) => (
                              <tr
                                key={name}
                                className="border-b border-gray-200"
                              >
                                <td></td>
                                <td className="px-4 py-2">
                                  {name} · {formatCOP(s.price)}
                                </td>
                                <td className="text-center">{s.count}</td>
                                <td className="text-right font-semibold">
                                  {formatCOP(s.total)}
                                </td>
                                <td className="text-right text-green-600 font-semibold">
                                  {formatCOP(s.commission)}
                                </td>
                                <td className="text-right text-gray-300">—</td>
                              </tr>
                            ))}

                            {Object.entries(data.products).map(([name, p]) => (
                              <tr
                                key={name}
                                className="border-b border-gray-200"
                              >
                                <td></td>
                                <td className="px-4 py-2 text-gray-600">
                                  <span className="inline-flex items-center gap-1.5">
                                    <CubeIcon className="h-4 w-4 flex-none text-gray-400" />
                                    {name}
                                  </span>
                                </td>
                                <td className="text-center">{p.count}</td>
                                <td className="text-right font-semibold">
                                  {formatCOP(p.total)}
                                </td>
                                <td className="text-right text-gray-300">—</td>
                                <td className="text-right font-semibold text-blue-600">
                                  {p.commission > 0 ? (
                                    formatCOP(p.commission)
                                  ) : (
                                    <span className="text-gray-300">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}

                            <tr className="bg-gray-100 font-semibold">
                              <td></td>
                              <td className="px-4 py-3">Totales comisión</td>
                              <td></td>
                              <td className="text-right text-purple-700">
                                {formatCOP(data.totals.total)}
                              </td>
                              <td className="text-right text-green-600">
                                {data.totals.servicesCommission > 0
                                  ? formatCOP(data.totals.servicesCommission)
                                  : '—'}
                              </td>
                              <td className="text-right text-blue-600">
                                {data.totals.productsCommission > 0
                                  ? formatCOP(data.totals.productsCommission)
                                  : '—'}
                              </td>
                            </tr>

                            {/* Cargos/descuentos: se restan del pago semanal (cortes) */}
                            {data.totals.charges > 0 &&
                              (data.chargesList || []).map((c) => (
                                <tr
                                  key={`ch-${c.id}`}
                                  className="border-b border-red-100 bg-red-50/40"
                                >
                                  <td></td>
                                  <td className="px-4 py-2 text-red-600">
                                    − {c.concept}
                                  </td>
                                  <td></td>
                                  <td></td>
                                  <td className="text-right font-semibold text-red-600">
                                    −{formatCOP(c.amount)}
                                  </td>
                                  <td className="text-right text-gray-300">—</td>
                                </tr>
                              ))}

                            {/* A pagar el sábado: cortes − cargos */}
                            <tr className="bg-orange-50 font-bold">
                              <td></td>
                              <td colSpan="3" className="px-4 py-3 text-gray-800">
                                A pagar el sábado
                                <span className="ml-1 text-xs font-normal text-gray-500">
                                  (cortes − cargos)
                                </span>
                              </td>
                              <td className="text-right text-orange-700">
                                {formatCOP(weeklyNet)}
                              </td>
                              <td className="text-right text-gray-300">—</td>
                            </tr>

                            {/* A pagar mensual: productos (del 3 al 2) */}
                            <tr className="bg-blue-50 font-bold">
                              <td></td>
                              <td colSpan="4" className="px-4 py-3 text-gray-800">
                                A pagar mensual — productos
                                <span className="ml-1 text-xs font-normal text-gray-500">
                                  (del 3 al 2)
                                </span>
                              </td>
                              <td className="text-right text-blue-700">
                                {data.totals.productsCommission > 0
                                  ? formatCOP(data.totals.productsCommission)
                                  : '—'}
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
