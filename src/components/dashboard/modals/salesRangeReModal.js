'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  XMarkIcon,
  CalendarDaysIcon,
  BuildingStorefrontIcon,
  UserIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import useLocals from '@/lib/api/hooks/useLocals';
import useUsers from '@/lib/api/hooks/useUsers';
import useDeliveredSales from '@/lib/api/hooks/useDeliveredSales';
import { formatCOP, toggleCase } from '@/lib/api/utils/utils';

export default function SalesRangeReModal({ onClose }) {
  const [locals, setLocals] = useState([]);
  const [users, setUsers] = useState([]);
  const [showMethods, setShowMethods] = useState(false);

  const [localId, setLocalId] = useState('');
  const [userId, setUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const { getLocals } = useLocals();
  const { getUsers } = useUsers();
  const { getSalesRangeReport } = useDeliveredSales();

  const fetchInitialData = useCallback(async () => {
    try {
      const localsRes = await getLocals();
      const usersRes = await getUsers();

      setLocals(localsRes?.data || []);
      setUsers(usersRes?.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [getLocals, getUsers]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleFetch = async () => {
    setLoading(true);
    try {
      const { data } = await getSalesRangeReport({
        startDate,
        endDate,
        localId,
        userId,
      });
      setResult(data);
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
            <ChartBarIcon className="w-8 h-8 text-green-400" />
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Reporte de Ventas por Rango
              </h2>
              <p className="text-sm text-gray-300">
                Cierre semanal, mensual o personalizado
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-4 py-5 sm:px-8 sm:py-6 border-b border-gray-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 [&>*]:min-w-0">
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-600">
                <CalendarDaysIcon className="w-4 h-4" />
                Desde
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-2 w-full cursor-pointer rounded-xl border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                className="mt-2 w-full cursor-pointer rounded-xl border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                className="mt-2 w-full rounded-xl cursor-pointer border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Seleccione</option>
                {locals.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-600">
                <UserIcon className="w-4 h-4" />
                Asesor (opcional)
              </label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="mt-2 w-full rounded-xl cursor-pointer border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Todos los asesores</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
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
            disabled={!startDate || !endDate || !localId}
            loading={loading}
            onClick={handleFetch}
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
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Resumen General
              </h3>

              {/* Desglose por barbero/asesor: lo vendido, su % y lo que gana */}
              {Array.isArray(result.total.users) &&
                result.total.users.length > 0 && (
                  <div className="mb-6 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200">
                          <th className="py-2 pr-3">Barbero / Asesor</th>
                          <th className="py-2 px-3 text-right">Vendido</th>
                          <th className="py-2 px-3 text-right">Servicios</th>
                          <th className="py-2 px-3 text-right">Productos</th>
                          <th className="py-2 px-3 text-center">% Serv.</th>
                          <th className="py-2 px-3 text-center">% Prod.</th>
                          <th className="py-2 pl-3 text-right">Gana (comisión)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.total.users.map((u) => (
                          <tr
                            key={u.userId}
                            className="border-b border-gray-100 last:border-0"
                          >
                            <td className="py-2 pr-3 font-semibold text-gray-800">
                              {toggleCase(u.name, 'uppercase')}
                            </td>
                            <td className="py-2 px-3 text-right text-gray-700">
                              {formatCOP(u.total)}
                            </td>
                            <td className="py-2 px-3 text-right text-gray-500">
                              {formatCOP(u.services)}
                            </td>
                            <td className="py-2 px-3 text-right text-gray-500">
                              {formatCOP(u.products)}
                            </td>
                            <td className="py-2 px-3 text-center text-gray-600">
                              {u.serviceRate != null ? `${u.serviceRate}%` : '—'}
                            </td>
                            <td className="py-2 px-3 text-center text-gray-600">
                              {u.productRate != null ? `${u.productRate}%` : '—'}
                            </td>
                            <td className="py-2 pl-3 text-right font-bold text-green-600">
                              {u.ratesConfigured ? (
                                formatCOP(u.commission)
                              ) : (
                                <span className="text-xs font-medium text-amber-600">
                                  sin % configurado
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600">
                  Total de ventas en el rango de{' '}
                  <span className="font-bold text-gray-900">
                    {result.startDate}
                  </span>{' '}
                  a{' '}
                  <span className="font-bold text-gray-900">
                    {result.endDate}
                  </span>
                </span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCOP(result.total.total)}
                </span>
              </div>

              <div className="mt-3 border-t border-gray-300 pt-3 space-y-2">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  Ventas por día
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-2">
                  {result.daily.map((day) => {
                    const hasSales = day.total > 0;

                    return (
                      <div
                        key={day.date}
                        className={`rounded-2xl border p-4 shadow-sm transition
                        ${
                          hasSales
                            ? 'bg-white border-green-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-gray-700">
                            {day.date}
                          </span>

                          <span
                            className={`text-sm font-bold ${
                              hasSales ? 'text-green-600' : 'text-gray-400'
                            }`}
                          >
                            {formatCOP(day.total)}
                          </span>
                        </div>

                        {hasSales && (
                          <div className="mt-2 h-2 w-full bg-green-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{
                                width: `${Math.min(
                                  (day.total / result.total.total) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 space-y-2">
                <div className="mt-4 pt-4 border-t border-gray-300 flex justify-center">
                  <Button
                    variant="link"
                    onClick={() => setShowMethods((prev) => !prev)}
                  >
                    {showMethods
                      ? 'Ocultar detalle por método de pago'
                      : 'Ver detalle por método de pago'}
                  </Button>
                </div>
              </div>
              {showMethods && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(result.methods).map(([method, data]) => (
                    <div
                      key={method}
                      className="flex justify-between items-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm"
                    >
                      <span className="font-medium text-gray-700">
                        {method}
                      </span>
                      <span className="font-bold text-gray-900">
                        {formatCOP(data.total)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
