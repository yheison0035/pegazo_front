'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  XMarkIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';

import useLocals from '@/lib/api/hooks/useLocals';
import useDeliveredSales from '@/lib/api/hooks/useDeliveredSales';
import { formatCOP } from '@/lib/api/utils/utils';

export default function ServicePerformanceModal({ onClose }) {
  const [locals, setLocals] = useState([]);
  const [localId, setLocalId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [result, setResult] = useState(null);
  const [globalTotal, setGlobalTotal] = useState(0);
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="relative bg-gradient-to-r from-gray-900 to-gray-700 px-8 py-6 text-white">
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

        <div className="bg-gray-50 px-8 py-6 border-b border-gray-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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

          <button
            onClick={handleFetch}
            disabled={!startDate || !endDate || !localId || loading}
            className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white py-3 cursor-pointer rounded-xl font-semibold transition disabled:opacity-50"
          >
            {loading ? 'Consultando...' : 'Generar reporte'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 bg-gray-100">
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
                        <th className="text-right px-4 py-3 border-b">
                          Comisión
                        </th>
                        <th className="text-right px-4 py-3 border-b"></th>
                      </tr>
                    </thead>

                    <tbody>
                      {Object.entries(result).map(([user, data]) => (
                        <React.Fragment key={user}>
                          <tr className="bg-gray-50 border-t">
                            <td
                              colSpan="5"
                              className="px-4 py-3 font-bold text-gray-800"
                            >
                              {user}
                            </td>
                            <td></td>
                          </tr>

                          {Object.entries(data.services).map(([name, s]) => (
                            <tr key={name} className="border-b border-gray-200">
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
                              <td></td>
                            </tr>
                          ))}

                          {Object.entries(data.products).map(([name, p]) => (
                            <tr key={name} className="border-b border-gray-200">
                              <td></td>

                              <td className="px-4 py-2 text-gray-600">
                                🛒 {name}
                              </td>

                              <td className="text-center">{p.count}</td>

                              <td className="text-right font-semibold">
                                {formatCOP(p.total)}
                              </td>

                              <td className="text-right text-gray-300">—</td>
                              <td></td>
                            </tr>
                          ))}

                          <tr className="bg-gray-100 font-semibold">
                            <td></td>

                            <td className="px-4 py-3">Totales</td>

                            <td></td>

                            <td className="text-right text-purple-700">
                              {formatCOP(data.totals.total)}
                            </td>

                            <td className="text-right text-green-600">
                              {data.totals.commission > 0
                                ? formatCOP(data.totals.commission)
                                : '—'}
                            </td>
                            <td></td>
                          </tr>
                        </React.Fragment>
                      ))}
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
